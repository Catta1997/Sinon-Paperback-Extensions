import {
  type Chapter,
  ContentRating,
  type DiscoverSectionItem,
  type MangaInfo,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import {
  capitalLetter,
  getDebugMode,
  getDefaultMetadata,
  getHideEmptyFav,
  getLangFlag,
  type Metadata,
  type SearchMetadata,
} from "./utils";
import { BASE_URL, network } from "./main";
import type { GalleryInfo, MangaElement } from "./models";

export class Parser {
  private parseTitle(str: string): string {
    if (!str) return "";
    return str
      .replaceAll(/(\[.*?]|\(.*?\))/g, "")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  private checkTable($: cheerio.CheerioAPI) {
    const $table = $("table.itg");
    if ($table.length === 0) {
      throw new Error("No Results Found");
    } else if ($table.hasClass("glte")) {
      return
    } else {
      throw new Error("Table Issue, please open extension settings and click on `Fix Table Issue`");
    }
  }
  private parseTable($: cheerio.CheerioAPI) {
    this.checkTable($);
    const results: MangaElement[] = [];
    $("tr")
      .has("td.gl1e")
      .each((_, el) => {
        const tags: string[] = [];
        const container = $(el);
        const title = container.find("div.glink").text().trim();
        const url = container.find("a").first().attr("href") ?? "";
        const image = container.find("img").first().attr("src") ?? "";
        const category = container.find(".gl3e .cn").text().trim();
        const date = container.find("div[id^='posted_']").text().trim();
        const pages = container
          .find(".gl3e > div")
          .filter((_, el) => $(el).text().trim().endsWith("pages"))
          .first()
          .text()
          .trim();
        // Debug: elementi che ci aspettiamo sempre
        if (!title) {
          console.log("[Parser] Missing title (.glink)", {
            url,
          });
        }
        if (!url) {
          console.log("[Parser] Missing manga URL (a)", {
            title,
          });
        }
        if (!image) {
          console.log("[Parser] Missing image (img)", {
            title,
            url,
          });
        }
        if (!category) {
          console.log("[Parser] Missing category (.gl3e .cn)", {
            title,
            url,
          });
        }
        if (!date) {
          console.log("[Parser] Missing date (#posted_*)", {
            title,
            url,
          });
        }
        if (!pages) {
          console.log("[Parser] Missing pages", {
            title,
            url,
          });
        }
        let artist = "";
        let lang = "";
        let rating = 0;
        // Rating
        const ratingElement = container.find("div.ir").first();
        const style = ratingElement.attr("style");

        if (!style) {
          console.log("[Parser] Missing rating element/style (div.ir)", {
            title,
            url,
          });
        } else {
          const match = /background-position:\s*(-?\d+)px\s+(-?\d+)px/.exec(style);

          if (!match) {
            console.log("[Parser] Unexpected rating style format", {
              title,
              url,
              style,
            });
          } else {
            const x = Number(match[1]);
            const y = Number(match[2]);

            rating = (x + 80) / 16 - (Math.abs(y) === 21 ? 0.5 : 0);
          }
        }
        // Artist + language in one traversal
        container.find("td.tc").each((_, td) => {
          const cell = $(td);
          const label = cell.text().trim();

          if (label === "artist:") {
            artist = cell.next("td").find("div").first().text().trim();

            if (!artist) {
              console.log("[Parser] Artist field exists but value is empty", {
                title,
                url,
              });
            }
          } else if (label === "language:") {
            cell
              .next("td")
              .find("div.gt, div.gtl")
              .each((_, el) => {
                const text = $(el).text().trim();

                if (text && text.toLowerCase() !== "translated") {
                  lang += `${lang ? " " : ""}${text} ${getLangFlag(text)}`;
                }
              });
            if (!lang) {
              console.log("[Parser] Language field exists but no language found", {
                title,
                url,
              });
            }
          }
          cell
            .next("td")
            .find("[style]")
            .each((_, el) => {
              const text = $(el).text().trim();
              if (text) {
                tags.push(text);
              }
            });
        });
        if (!lang) {
          console.log("[Parser] No language found, defaulting to Japanese", {
            title,
            url,
          });
          lang = `Japanese ${getLangFlag("japanese")}`;
        }

        const subtitle = capitalLetter([lang, artist].filter(Boolean).join(" | "));
        results.push({
          title,
          image,
          url,
          lang,
          artist,
          subtitle,
          pages,
          category,
          date,
          rating,
          tags,
        });
      });
    if (getDebugMode()) {
      console.log(`results table: ${results.length}`);
    }

    if (results.length === 0) {
      console.log("[Parser] parseTable() found no results");
    }

    return results;
  }

  async parseSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? "";
    const html = query.metadata?.favoriteID?.length
      ? await network.favoriteRequest(`${query.metadata.favoriteID}&next=${page}`)
      : await network.searchRequest(query, metadata);
    const $ = cheerio.load(html);
    const parsed = this.parseTable($);
    const results: SearchResultItem[] = Array.from({ length: parsed.length });
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      results[i] = {
        mangaId: item.url.replace(`${BASE_URL}/g/`, ""),
        title: this.parseTitle(item.title),
        imageUrl: item.image,
        subtitle: item.subtitle,
        contentRating: ContentRating.ADULT,
      };
    }
    if (getDebugMode()) {
      console.log(`results search: ${results.length}`);
    }
    if (results.length === 0) {
      return {
        items: [],
        metadata: undefined,
      };
    }
    const href = $("#unext").attr("href");
    if (!href) {
      return {
        items: results,
        metadata: undefined,
      };
    }
    const nextValue = /next=([^&]+)/.exec(href)?.[1] ?? "";
    return {
      items: results,
      metadata: nextValue ? { page: nextValue } : undefined,
    };
  }

  async parseFeatured(metadata: Metadata): Promise<PagedResults<DiscoverSectionItem>> {
    const html = await network.getSection("", metadata);
    return this.parseDiscover(html, "featured");
  }

  async parseRecent(metadata: Metadata) {
    const html = await network.getSection("popular", metadata);
    return this.parseDiscover(html, "recent");
  }

  async parseWatched(metadata: Metadata) {
    await Application.scheduleRequest({ url: `${BASE_URL}/mytags`, method: "GET" });
    const html = await network.getSection("watched", metadata);
    return this.parseDiscover(html, "watched");
  }

  async parseFavorite(): Promise<PagedResults<DiscoverSectionItem>> {
    let favs = await network.getFevList();
    if (getHideEmptyFav()) {
      favs = favs.filter((fav) => fav.number > 0);
    }
    if (favs.length === 0) {
      throw new Error(`All Favourites are empty`);
    }
    return {
      items: favs.map((favorite) => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          metadata: getDefaultMetadata(favorite.id),
        },
        name: favorite.value,
        contentRating: ContentRating.ADULT,
      })),
    };
  }

  private async parseDiscover(
    html: string,
    path: string,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const $ = cheerio.load(html);
    let nextValue = "";
    const nextEl = $("#unext");
    if (nextEl.is("a")) {
      const href = nextEl.attr("href") ?? "";
      const match = href.match(/next=([^&]+)/);
      nextValue = match && match[1] ? match[1] : "";
    }
    return {
      items: this.parseTable($).map((item) => ({
        type: "featuredCarouselItem",
        mangaId: item.url.replace(`${BASE_URL}/g/`, ""),
        title: this.parseTitle(item.title),
        supertitle: item.category,
        summary: this.generateSummary(item, path),
        infoItems: [
          { symbol: "star.fill", text: String(item.rating) },
          { symbol: "book.pages", text: item.pages },
        ],
        imageUrl: item.image,
        contentRating: ContentRating.ADULT,
      })),
      metadata: nextValue.length > 0 ? { page: nextValue } : undefined,
    };
  }

  generateSummary(item: MangaElement, path: string) {
    if (path === "watched") {
      return `Language: ${capitalLetter(item.lang)}\nWatched Tags: ${item.tags.map((tag) => capitalLetter(tag)).join(", ")}`;
    } else {
      return `Language: ${capitalLetter(item.lang)}${item.artist.length > 0 ? `\nArtist: ` + capitalLetter(item.artist) : ``}\nDate: ${this.parseDate(item.date)}`;
    }
  }

  async parseMangaDetail(mangaID: string): Promise<any> {
    const html = await network.mangaDetailRequest(mangaID);
    if (!html || !html.trim()) {
      console.log("[Parser] Manga detail returned empty HTML", {
        mangaID,
      });
    }
    const $ = cheerio.load(html);
    const additionalMangaInfo = this.parseGalleryInfo($);
    const tagSectionList: TagSection[] = [];
    const languages: string[] = [];
    let artist = "";
    // Category
    if (!additionalMangaInfo.category) {
      console.log("[Parser] Manga category not found", {
        mangaID,
      });
    }
    tagSectionList.push({
      id: "category",
      title: "Category",
      tags: [
        {
          id: additionalMangaInfo.category.toLowerCase().replaceAll(" ", "_"),
          title: capitalLetter(additionalMangaInfo.category),
        },
      ],
    });

    // Tags
    const tagList = $("#taglist");

    if (tagList.length === 0) {
      console.log("[Parser] Tag list (#taglist) not found", {
        mangaID,
      });
    }

    const tagRows = tagList.find("tr");

    if (tagRows.length === 0) {
      console.log("[Parser] No tag rows found", {
        mangaID,
      });
    }

    tagRows.each((_, el) => {
      const row = $(el);
      const categoryText = row.find("td.tc").text().trim();
      if (!categoryText) {
        console.log("[Parser] Tag row has no category", {
          mangaID,
          html: $.html(row),
        });
      }
      const category = categoryText.split(":", 1)[0];
      const tags: Tag[] = [];
      row.find('td div[class^="gt"] > a').each((_, a) => {
        const tagId = $(a).attr("id") ?? "";
        const tagTitle = capitalLetter($(a).text().trim().replaceAll(/\s+/g, " "));

        if (!tagId) {
          console.log("[Parser] Tag found without ID", {
            mangaID,
            category,
            tagTitle,
          });
        }
        if (!tagTitle) {
          console.log("[Parser] Tag found without title", {
            mangaID,
            category,
            tagId,
          });
        }
        const tag: Tag = {
          id: tagId,
          title: tagTitle,
        };
        tags.push(tag);
        if (tagId.includes("ta_artist")) {
          artist = tagTitle;
        }
        if (category === "language" && tagTitle !== "Translated") {
          const flag = getLangFlag(tagTitle.toLowerCase());

          if (!flag) {
            console.log("[Parser] Language found but no flag available", {
              mangaID,
              language: tagTitle,
            });
          }

          if (tagTitle) {
            languages.push(`${tagTitle} ${flag}`);
          }
        }
      });
      if (category !== "artist" && category !== "language") {
        tagSectionList.push({
          id: category,
          title: capitalLetter(category),
          tags,
        });
      }
    });
    if (!artist) {
      console.log("[Parser] Artist not found", {
        mangaID,
      });
    }
    if (languages.length === 0) {
      console.log("[Parser] No languages found", {
        mangaID,
      });
    }
    // Cover
    const style = $("#gd1 > div").attr("style") ?? "";
    if (!style) {
      console.log("[Parser] Manga cover style not found", {
        mangaID,
      });
    }

    const imageMatch = /url\(([^)]+)\)/.exec(style);

    if (!imageMatch) {
      console.log("[Parser] Manga cover URL not found", {
        mangaID,
        style,
      });
    }

    const imageUrl = imageMatch?.[1] ?? "";

    // Titles
    const title = $("#gn").text().trim();
    const secondaryTitle = $("#gj").text().trim();
    if (!title) {
      console.log("[Parser] Manga title (#gn) not found", {
        mangaID,
      });
    }
    if (!secondaryTitle) {
      console.log("[Parser] Secondary title (#gj) not found", {
        mangaID,
      });
    }
    const primaryTitle = this.parseTitle(title);
    const secondaryParsedTitle = this.parseTitle(secondaryTitle);
    const info: MangaInfo = {
      thumbnailUrl: imageUrl,
      synopsis: "",
      artist: capitalLetter(artist),
      rating: additionalMangaInfo.rating.average / 500,
      secondaryTitles: [secondaryParsedTitle],
      primaryTitle,
      contentRating: ContentRating.ADULT,
      tagGroups: tagSectionList,
      additionalInfo: {
        title: primaryTitle.split("| ")[1] ?? "",
        pages: additionalMangaInfo.length.pages.toString(),
        language: languages.join(" | "),
        uploaded: additionalMangaInfo.posted.replaceAll(" ", "T"),
        favorite: additionalMangaInfo.favs.text.replaceAll("times", "favorite"),
      },
      shareUrl: `https://${BASE_URL}/g/${mangaID}`,
    };
    return {
      mangaId: mangaID,
      mangaInfo: info,
    };
  }

  async parseChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const info = sourceManga.mangaInfo?.additionalInfo;
    return [
      {
        chapterId: sourceManga.mangaId,
        title: info?.title ?? undefined,
        sourceManga: sourceManga,
        chapNum: 1,
        volume: 0,
        langCode: info?.language ?? "",
        publishDate: new Date(info?.uploaded ?? ""),
        version: info?.pages ? `${info?.pages} Pages` : "",
        additionalInfo: { pages: info?.pages ?? "0" },
      },
    ];
  }

  async scrapeAllChapterPages(chapter: Chapter) {
    const images = await this.scrapeAllChapterPagesList(chapter);
    return {
      id: chapter.chapterId,
      mangaId: chapter.chapterId,
      pages: images,
    };
  }

  private parseGalleryInfo($: cheerio.CheerioAPI): GalleryInfo {
    const root = $("#gmid #gd3");
    if (root.length === 0) {
      console.log("[Parser] Gallery root (#gmid #gd3) not found");
    }
    const category = root.find("#gdc div").first().text().trim();
    if (!category) {
      console.log("[Parser] Gallery category (#gdc) not found");
    }
    let uploaderName = root.find("#gdn a").first().text().trim();
    const tags = $("#gmid #gd4");
    if (tags.length === 0) {
      console.log("[Parser] Gallery tags (#gmid #gd4) not found");
    }

    tags.find("td.tc").each((_, td) => {
      const label = $(td).text().trim();
      if (label === "artist:") {
        uploaderName = $(td).next("td").find("div").first().text().trim();

        if (!uploaderName) {
          console.log("[Parser] Artist/uploader field is empty");
        }

        return false;
      }
    });
    let posted = "";
    let lengthPages = 0;
    let favsText = "";

    const galleryDetails = $("#gdd");

    if (galleryDetails.length === 0) {
      console.log("[Parser] Gallery details (#gdd) not found");
    }

    $("#gdd .gdt1").each((_, el) => {
      const label = $(el).text().trim();
      const value = $(el).next(".gdt2").text().trim();
      if (label === "Posted:") {
        posted = value;
      } else if (label === "Length:") {
        lengthPages = parseInt(value, 10) || 0;
      } else if (label === "Favorited:") {
        favsText = value;
      }
    });
    if (!posted) {
      console.log("[Parser] Posted date not found", {
        availableLabels: $("#gdd .gdt1")
          .map((_, el) => $(el).text().trim())
          .get(),
      });
    }
    if (lengthPages === 0) {
      console.log("[Parser] Gallery length/pages not found", {
        posted,
      });
    }
    if (!favsText) {
      console.log("[Parser] Favorite count not found", {
        posted,
      });
    }
    const ratingText = $("#rating_label").text().replace("Average:", "").replaceAll(".", "").trim();
    if (!ratingText) {
      console.log("[Parser] Rating text (#rating_label) not found");
    }
    const ratingAverage = parseFloat(ratingText);
    if (Number.isNaN(ratingAverage)) {
      console.log("[Parser] Rating could not be parsed", {
        ratingText,
      });
    }
    return {
      category,
      uploader: {
        name: uploaderName,
      },
      posted,
      length: {
        pages: lengthPages,
      },
      favs: {
        text: favsText,
      },
      rating: {
        average: Number.isNaN(ratingAverage) ? 0 : ratingAverage,
      },
    };
  }

  async scrapeAllChapterPagesList(chapter: Chapter) {
    const totalImages = Number(chapter?.additionalInfo?.pages ?? "0");
    if (!chapter.additionalInfo?.pages) {
      console.log("[Parser] Chapter has no pages metadata", {
        chapterId: chapter.chapterId,
        additionalInfo: chapter.additionalInfo,
      });
    }
    if (getDebugMode()) {
      console.log(`totalImages: ${totalImages}`);
    }
    if (totalImages === 0) {
      console.log("[Parser] Chapter has 0 pages", {
        chapterId: chapter.chapterId,
        additionalInfo: chapter.additionalInfo,
      });
    }
    const IMAGES_PER_PAGE = 20;
    const totalPages = Math.ceil(totalImages / IMAGES_PER_PAGE);
    const pageUrls = Array.from(
      { length: totalPages },
      (_, page) => `${BASE_URL}/g/${chapter.chapterId}?p=${page}`,
    );
    if (getDebugMode()) {
      console.log("[Parser] Chapter page URLs", {
        chapterId: chapter.chapterId,
        totalImages,
        totalPages,
        pageUrls,
      });
    }
    const htmlPages = await Promise.all(pageUrls.map((url) => network.getChapterPages(url)));
    const results: string[] = [];
    for (let i = 0; i < htmlPages.length; i++) {
      const html = htmlPages[i];
      const $ = cheerio.load(html);
      const pageLinks = $("#gdt a");
      if (pageLinks.length === 0) {
        console.log("[Parser] No page links found on chapter page", {
          chapterId: chapter.chapterId,
          page: i,
          url: pageUrls[i],
        });
      }
      pageLinks.each((_, el) => {
        if (results.length >= totalImages) {
          return false;
        }
        const url = $(el).attr("href");
        if (!url) {
          console.log("[Parser] Chapter page link has no href", {
            chapterId: chapter.chapterId,
            page: i,
          });
          return;
        }
        results.push(url);
      });

      if (getDebugMode()) {
        console.log("[Parser] Chapter page parsed", {
          chapterId: chapter.chapterId,
          page: i,
          linksFound: pageLinks.length,
          totalResults: results.length,
        });
      }
      if (results.length >= totalImages) {
        break;
      }
    }
    if (results.length !== totalImages) {
      console.log("[Parser] Page count mismatch", {
        chapterId: chapter.chapterId,
        expected: totalImages,
        found: results.length,
        requestedPages: totalPages,
      });
    }
    if (getDebugMode()) {
      console.log(`results chapters: ${results.length}`);
    }
    if (results.length === 0) {
      console.log("[Parser] No pages found, scraping error", {
        chapterId: chapter.chapterId,
        totalImages,
        totalPages,
      });
    }
    return results;
  }

  async parseFavoriteList(favoriteID: string): Promise<SourceManga[]> {
    let html = await network.favoriteRequest(favoriteID);
    const mangas: SourceManga[] = [];
    let results: { mangaId: string; title: string }[] = [];
    while (true) {
      const $ = cheerio.load(html);
      results.push(
        ...this.parseTable($).map((item) => ({
          mangaId: item.url?.replace(`${BASE_URL}/g/`, "") ?? "",
          title: this.parseTitle(item.title),
        })),
      );
      if (results.length === 0) {
        return mangas;
      }
      const href = $("#unext").attr("href");
      if (!href) {
        break;
      }
      const nextValue = href.match(/next=([^&]+)/)?.[1];
      if (!nextValue) {
        break;
      }
      html = await network.favoriteRequest(`${favoriteID}&next=${nextValue}`);
    }
    const parsedMangas = await Promise.all(
      results.map(async ({ mangaId }) => {
        try {
          return await this.parseMangaDetail(mangaId);
        } catch (e) {
          console.log(`Failed to parse manga ${mangaId}`, e);
          return null;
        }
      }),
    );
    mangas.push(...parsedMangas.filter((manga): manga is SourceManga => manga !== null));
    if (getDebugMode()) {
      console.log(`mangas: ${mangas.length}`);
    }
    if (mangas.length === 0) {
      console.log("No favorite found");
    }
    return mangas;
  }

  parseDate(input: string) {
    const [date, time] = input.split(" ");
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year} ${time}`;
  }
}
