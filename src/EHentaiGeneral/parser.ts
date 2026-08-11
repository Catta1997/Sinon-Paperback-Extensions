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
  getLangFlag,
  type Metadata,
  type SearchMetadata,
} from "./utils";
import { BASE_URL, network } from "./main";
import type { GalleryInfo } from "./models";

export class Parser {
  private parseTitle(str: string): string {
    return str
      .replaceAll(/(\[.*?]|\(.*?\))/g, "")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  private parseTable($: cheerio.CheerioAPI) {
    const results: {
      title: string;
      image: string;
      url: string;
      lang: string;
      artist: string;
      subtitle: string;
      category: string;
      pages: string;
      date: string;
      rating: number;
    }[] = [];
    $("tr")
      .has("td.gl1e")
      .each((_, el) => {
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
        let artist = "";
        let lang = "";
        let rating = 0;
        // Rating
        const style = container.find("div.ir").attr("style");
        if (style) {
          const match = /background-position:\s*(-?\d+)px\s+(-?\d+)px/.exec(style);

          if (match) {
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
          }
        });
        if (!lang) {
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
        });
      });
    if (getDebugMode()) {
      throw new Error(`results: ${results.length}`);
    }

    return results;
  }

  async parseSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    const html = query.metadata?.favoriteID?.length
      ? await network.favoriteRequest(query.metadata.favoriteID)
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
      throw new Error(`results: ${results.length}`);
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
    return this.parseDiscover(html);
  }

  async parseRecent(metadata: Metadata) {
    const html = await network.getSection("popular", metadata);
    return this.parseDiscover(html);
  }

  async parseWatched(metadata: Metadata) {
    await Application.scheduleRequest({ url: `${BASE_URL}/mytags`, method: "GET" });
    const html = await network.getSection("watched", metadata);
    return this.parseDiscover(html);
  }

  async parseFavorite(): Promise<PagedResults<DiscoverSectionItem>> {
    const favs = await network.getFevList();
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

  private async parseDiscover(html: string): Promise<PagedResults<DiscoverSectionItem>> {
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
        summary: `Language: ${capitalLetter(item.lang)}${item.artist.length > 0 ? `\nArtist: ` + capitalLetter(item.artist) : ``}\nDate: ${this.parseDate(item.date)}`,
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

  async parseMangaDetail(mangaID: string): Promise<any> {
    const html = await network.mangaDetailRequest(mangaID);
    const $ = cheerio.load(html);
    const additionalMangaInfo = this.parseGalleryInfo($);
    const tagSectionList: TagSection[] = [];
    const languages: string[] = [];
    let artist = "";
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
    $("#taglist tr").each((_, el) => {
      const row = $(el);
      const categoryText = row.find("td.tc").text().trim();
      const category = categoryText.split(":", 1)[0];
      const tags: Tag[] = [];
      row.find('td div[class^="gt"] > a').each((_, a) => {
        const tagId = $(a).attr("id") ?? "";
        const tagTitle = capitalLetter($(a).text().trim().replaceAll(/\s+/g, " "));

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
          if (flag) {
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
    const style = $("#gd1 > div").attr("style") ?? "";
    const imageUrl = /url\(([^)]+)\)/.exec(style)?.[1] ?? "";
    const title = $("#gn").text().trim();
    const secondaryTitle = $("#gj").text().trim();
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
    const category = root.find("#gdc div").first().text().trim();
    let uploaderName = root.find("#gdn a").first().text().trim();
    const tags = $("#gmid #gd4");
    tags.find("td.tc").each((_, td) => {
      const label = $(td).text().trim();
      if (label === "artist:") {
        uploaderName = $(td).next("td").find("div").first().text().trim();
        return false;
      }
    });
    let posted = "";
    let lengthPages = 0;
    let favsText = "";
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
    const ratingText = $("#rating_label").text().replace("Average:", "").replaceAll(".", "").trim();
    const ratingAverage = parseFloat(ratingText);
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
    if (getDebugMode()) {
      throw new Error(`totalImages: ${totalImages}`);
    }
    if (totalImages === 0) {
      throw new Error("No pages found, total images 0");
    }
    const IMAGES_PER_PAGE = 20;
    const totalPages = Math.ceil(totalImages / IMAGES_PER_PAGE);
    const pageUrls = Array.from(
      { length: totalPages },
      (_, page) => `${BASE_URL}/g/${chapter.chapterId}?p=${page}`,
    );
    const htmlPages = await Promise.all(pageUrls.map((url) => network.getChapterPages(url)));
    const results: string[] = [];
    const selector = `a[href^="${BASE_URL}/s/"]`;
    for (const html of htmlPages) {
      const $ = cheerio.load(html);
      $(selector).each((_, _el) => {
        if (results.length >= totalImages) {
          return false;
        }
        $(selector).each((_, el) => {
          const url = $(el).attr("href");
          if (url) {
            results.push(url);
          }
        });
      });
      if (results.length >= totalImages) {
        break;
      }
    }
    if (getDebugMode()) {
      throw new Error(`results: ${results.length}`);
    }
    if (results.length === 0) {
      throw new Error("No pages found, scraping error");
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
      throw new Error(`mangas: ${mangas.length}`);
    }
    if (mangas.length === 0) {
      throw new Error("No favorite found");
    }
    return mangas;
  }

  parseDate(input: string) {
    const [date, time] = input.split(" ");
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year} ${time}`;
  }
}
