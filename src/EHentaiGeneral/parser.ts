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
  debugPrint,
  getDefaultMetadata,
  getHideEmptyFav,
  getLangFlag,
  type Metadata,
  type SearchMetadata,
  tableFix,
} from "./utils";
import { BASE_URL, network } from "./main";
import { galleryIdFromUrl, galleryUrl } from "./network";
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
      return false;
    } else if ($table.hasClass("glte")) {
      return true;
    } else {
      tableFix.needTableFix = true;
      throw new Error("Table Issue, please open extension settings and click on `Fix Table Issue`");
    }
  }
  private warnIfEmpty(value: unknown, message: string, context?: object) {
    if (!value) {
      debugPrint(`[Parser] ${message}`, ...(context ? [context] : []));
    }
  }

  /** Value of the `next=` query param of the "next page" link (#unext), if any. */
  private getNextPage($: cheerio.CheerioAPI): string | undefined {
    return /next=([^&]+)/.exec($("#unext").attr("href") ?? "")?.[1];
  }

  /** Text of the first `div` next to the `td.tc` cell labelled `label` (e.g. "artist:"). */
  private findTagRowValue(
    $: cheerio.CheerioAPI,
    scope: cheerio.Cheerio<any>,
    label: string,
  ): string | undefined {
    const cell = scope
      .find("td.tc")
      .filter((_, td) => $(td).text().trim() === label)
      .first();
    return cell.length > 0 ? cell.next("td").find("div").first().text().trim() : undefined;
  }

  /** The rating is encoded in the background-position of the star sprite. */
  private parseRating(container: cheerio.Cheerio<any>): number {
    const style = container.find("div.ir").first().attr("style");
    if (!style) {
      debugPrint("[Parser] Missing rating element/style (div.ir)");
      return 0;
    }
    const match = /background-position:\s*(-?\d+)px\s+(-?\d+)px/.exec(style);
    if (!match) {
      debugPrint("[Parser] Unexpected rating style format");
      return 0;
    }
    const x = Number(match[1]);
    const y = Number(match[2]);
    return isNaN(x) || isNaN(y) ? 0 : (x + 80) / 16 - (Math.abs(y) === 21 ? 0.5 : 0);
  }

  /** Language (with flag) and tag names shown in the tag cells of a gallery row. */
  private parseRowTags($: cheerio.CheerioAPI, container: cheerio.Cheerio<any>) {
    const tags: string[] = [];
    const fullTags: string[] = [];
    let lang = "";
    container.find("td.tc").each((_, td) => {
      const cell = $(td);
      const valueCell = cell.next("td");

      if (cell.text().trim() === "language:") {
        valueCell.find("div.gt, div.gtl").each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.toLowerCase() !== "translated") {
            lang += `${lang ? " " : ""}${text} ${getLangFlag(text)}`;
          }
        });
        this.warnIfEmpty(lang, "Language field exists but no language found");
      }
      valueCell.find("[style]").each((_, el) => {
        const text = $(el).text().trim();
        if (text) {
          tags.push(text);
          // the title attribute has the namespace: "female:stockings"
          fullTags.push($(el).attr("title") ?? text);
        }
      });
    });
    if (!lang) {
      debugPrint("[Parser] No language found, defaulting to Japanese");
      lang = `Japanese ${getLangFlag("japanese")}`;
    }
    return { lang, tags, fullTags };
  }

  private parseTable($: cheerio.CheerioAPI) {
    if (!this.checkTable($)) {
      return [];
    }
    const results: MangaElement[] = [];
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
        this.warnIfEmpty(title, "Missing title (.glink)");
        this.warnIfEmpty(url, "Missing manga URL (a)");
        this.warnIfEmpty(image, "Missing image (img)");
        this.warnIfEmpty(category, "Missing category (.gl3e .cn)");
        this.warnIfEmpty(date, "Missing date (#posted_*)");
        this.warnIfEmpty(pages, "Missing pages");

        const artistValue = this.findTagRowValue($, container, "artist:");
        if (artistValue !== undefined) {
          this.warnIfEmpty(artistValue, "Artist field exists but value is empty");
        }
        const artist = artistValue ?? "";
        const { lang, tags, fullTags } = this.parseRowTags($, container);

        results.push({
          title,
          image,
          url,
          lang,
          artist,
          subtitle: capitalLetter([lang, artist].filter(Boolean).join(" | ")),
          pages,
          category,
          date,
          rating: this.parseRating(container),
          tags,
          fullTags,
        });
      });
    debugPrint(`[Parser] parseTable() found ${results.length} results`);
    return results;
  }

  async parseSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? "";
    const html = query.metadata?.favoriteID?.length
      ? await network.fetchHtml(`${query.metadata.favoriteID}&next=${page}`)
      : await network.searchRequest(query, metadata);
    const $ = cheerio.load(html);
    const results: SearchResultItem[] = this.parseTable($).map((item) => ({
      mangaId: galleryIdFromUrl(item.url),
      title: this.parseTitle(item.title),
      imageUrl: item.image,
      subtitle: item.subtitle,
      contentRating: ContentRating.ADULT,
    }));
    debugPrint(`[Parser] parseSearchResults() found ${results.length} results`);
    const next = this.getNextPage($);
    return {
      items: results,
      metadata: results.length > 0 && next ? { page: next } : undefined,
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

  async parseTop(metadata: Metadata) {
    const html = await network.getSection("toplist", metadata);
    return this.parseDiscover(html, "toplist");
  }

  async parseWatched(metadata: Metadata) {
    await network.fetchHtml(`${BASE_URL}/mytags`);
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
    const next = this.getNextPage($);
    return {
      items: this.parseTable($).map((item) => ({
        type: "featuredCarouselItem",
        mangaId: galleryIdFromUrl(item.url),
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
      metadata: next ? { page: next } : undefined,
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
      debugPrint("[Parser] Manga detail returned empty HTML", {
        mangaID,
      });
    }
    const $ = cheerio.load(html);
    const additionalMangaInfo = this.parseGalleryInfo($);
    const tagSectionList: TagSection[] = [];
    const languages: string[] = [];
    let artist = "";
    this.warnIfEmpty(additionalMangaInfo.category, "Manga category not found", { mangaID });
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

    const tagList = $("#taglist");

    this.warnIfEmpty(tagList.length, "Tag list (#taglist) not found", { mangaID });

    const tagRows = tagList.find("tr");

    this.warnIfEmpty(tagRows.length, "No tag rows found", { mangaID });

    tagRows.each((_, el) => {
      const row = $(el);
      const categoryText = row.find("td.tc").text().trim();
      this.warnIfEmpty(categoryText, "Tag row has no category", { mangaID });
      const category = categoryText.split(":", 1)[0];
      const tags: Tag[] = [];
      row.find('td div[class^="gt"] > a').each((_, a) => {
        const tagId = $(a).attr("id") ?? "";
        const tagTitle = capitalLetter($(a).text().trim().replaceAll(/\s+/g, " "));

        this.warnIfEmpty(tagId, "Tag found without ID", { mangaID, category, tagTitle });
        this.warnIfEmpty(tagTitle, "Tag found without title", { mangaID, category, tagId });
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

          this.warnIfEmpty(flag, "Language found but no flag available", {
            mangaID,
            language: tagTitle,
          });

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
    this.warnIfEmpty(artist, "Artist not found", { mangaID });
    this.warnIfEmpty(languages.length, "No languages found", { mangaID });
    const style = $("#gd1 > div").attr("style") ?? "";
    this.warnIfEmpty(style, "Manga cover style not found", { mangaID });

    const imageMatch = /url\(([^)]+)\)/.exec(style);

    this.warnIfEmpty(imageMatch, "Manga cover URL not found", { mangaID, style });

    const imageUrl = imageMatch?.[1] ?? "";
    const title = $("#gn").text().trim();
    const secondaryTitle = $("#gj").text().trim();
    this.warnIfEmpty(title, "Manga title (#gn) not found", { mangaID });
    this.warnIfEmpty(secondaryTitle, "Secondary title (#gj) not found", { mangaID });
    const primaryTitle = this.parseTitle(title);
    const secondaryParsedTitle = this.parseTitle(secondaryTitle);
    const info: MangaInfo = {
      thumbnailUrl: imageUrl,
      synopsis: additionalMangaInfo.synopsis,
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
      shareUrl: galleryUrl(mangaID),
    };
    return {
      mangaId: mangaID,
      mangaInfo: info,
    };
  }

  parseFavoriteItem(item: MangaElement): SourceManga {
    const mangaId = galleryIdFromUrl(item.url);
    const tagSectionList: TagSection[] = [
      {
        id: "category",
        title: "Category",
        tags: [
          {
            id: item.category.toLowerCase().replaceAll(" ", "_"),
            title: capitalLetter(item.category),
          },
        ],
      },
    ];

    const tagsByNamespace = new Map<string, Tag[]>();
    for (const rawTag of item.fullTags) {
      const hasNamespace = rawTag.includes(":");
      const namespace = hasNamespace ? rawTag.split(":")[0] : "other";
      const name = hasNamespace ? rawTag.slice(namespace.length + 1) : rawTag;
      if (namespace === "artist" || namespace === "language") continue;
      const tag: Tag = {
        id: `ta_${rawTag.replaceAll(" ", "_")}`,
        title: capitalLetter(name),
      };
      tagsByNamespace.set(namespace, [...(tagsByNamespace.get(namespace) ?? []), tag]);
    }
    tagsByNamespace.forEach((tags, namespace) => {
      tagSectionList.push({ id: namespace, title: capitalLetter(namespace), tags });
    });

    const primaryTitle = this.parseTitle(item.title);
    const info: MangaInfo = {
      thumbnailUrl: item.image,
      synopsis: "",
      artist: capitalLetter(item.artist),
      rating: item.rating / 5,
      secondaryTitles: [],
      primaryTitle,
      contentRating: ContentRating.ADULT,
      tagGroups: tagSectionList,
      additionalInfo: {
        title: primaryTitle.split("| ")[1] ?? "",
        pages: (parseInt(item.pages.replaceAll(",", ""), 10) || 0).toString(), // "25 pages" -> "25"
        language: item.lang,
        uploaded: item.date.replaceAll(" ", "T"),
      },
      shareUrl: galleryUrl(mangaId),
    };
    return { mangaId, mangaInfo: info };
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
    this.warnIfEmpty(root.length, "Gallery root (#gmid #gd3) not found");
    const category = root.find("#gdc div").first().text().trim();
    this.warnIfEmpty(category, "Gallery category (#gdc) not found");
    let uploaderName = root.find("#gdn a").first().text().trim();
    const tags = $("#gmid #gd4");
    this.warnIfEmpty(tags.length, "Gallery tags (#gmid #gd4) not found");

    const artistName = this.findTagRowValue($, tags, "artist:");
    if (artistName !== undefined) {
      uploaderName = artistName;
      this.warnIfEmpty(uploaderName, "Artist/uploader field is empty");
    }
    let posted = "";
    let lengthPages = 0;
    let favsText = "";
    let synopsis = "";
    const galleryDetails = $("#gdd");
    this.warnIfEmpty(galleryDetails.length, "Gallery details (#gdd) not found");
    $("#cdiv.gm div.c1").each((comment, el) => {
      if ($(el).find("a[name='ulcomment']").length > 0) {
        let commentHtml = $(el).find("div.c6").html();
        if (commentHtml) {
          let textWithNewlines = commentHtml.replace(/(<br\s*\/?>)+/gi, "\n");
          synopsis = `Uploader Comment:\n${$("<div>").html(textWithNewlines).text().trim()}`;
        }
      }
    });
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
      debugPrint("[Parser] Posted date not found", {
        availableLabels: $("#gdd .gdt1")
          .map((_, el) => $(el).text().trim())
          .get(),
      });
    }
    this.warnIfEmpty(lengthPages, "Gallery length/pages not found", { posted });
    this.warnIfEmpty(favsText, "Favorite count not found", { posted });
    const ratingText = $("#rating_label").text().replace("Average:", "").replaceAll(".", "").trim();
    this.warnIfEmpty(ratingText, "Rating text (#rating_label) not found");
    const ratingAverage = parseFloat(ratingText);
    if (Number.isNaN(ratingAverage)) {
      debugPrint("[Parser] Rating could not be parsed", {
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
      synopsis: synopsis,
    };
  }

  // Links of the pages (/s/...) shown in a gallery page
  private getPageLinks($: cheerio.CheerioAPI): string[] {
    const urls: string[] = [];
    $("#gdt a").each((_, el) => {
      const href = $(el).attr("href");
      if (href) urls.push(href);
    });
    return urls;
  }

  async scrapeAllChapterPagesList(chapter: Chapter) {
    const totalImages = Number(chapter?.additionalInfo?.pages ?? "0");
    if (totalImages === 0) return [];

    // The first gallery page is downloaded only once: it also tells how many thumbnails each page has
    const firstPage = this.getPageLinks(
      cheerio.load(await network.mangaDetailRequest(chapter.chapterId)),
    );
    const imagesPerPage = firstPage.length;
    debugPrint(`[Parser] Chapter has ${imagesPerPage} thumbnails per page`, {
      chapterId: chapter.chapterId,
      additionalInfo: chapter.additionalInfo,
    });
    if (imagesPerPage === 0) {
      debugPrint("[Parser] No pages found in the first gallery page, scraping error");
      return [];
    }
    const totalPages = Math.ceil(totalImages / imagesPerPage);
    debugPrint(`[Parser] Chapter has ${totalImages} images and ${totalPages} pages`, {
      chapterId: chapter.chapterId,
      additionalInfo: chapter.additionalInfo,
    });

    // pages 1, 2, 3... (page 0 is already done)
    const otherPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, async (_, i) => {
        const url = `${galleryUrl(chapter.chapterId)}?p=${i + 1}`;
        return this.getPageLinks(cheerio.load(await network.fetchHtml(url)));
      }),
    );

    // Promise.all keeps the order, so the pages are already sorted
    const results = [...firstPage, ...otherPages.flat()].slice(0, totalImages);
    debugPrint(`[Parser] chapters: ${results.length}`);
    this.warnIfEmpty(results.length, "No pages found, scraping error");
    return results;
  }

  async parseFavoriteList(favoriteID: string): Promise<SourceManga[]> {
    let html = await network.fetchHtml(favoriteID);
    const mangas: SourceManga[] = [];
    while (true) {
      const $ = cheerio.load(html);
      // every row of the list already has all the data we need
      mangas.push(...this.parseTable($).map((item) => this.parseFavoriteItem(item)));
      const next = this.getNextPage($);
      if (!next) {
        break;
      }
      html = await network.fetchHtml(`${favoriteID}&next=${next}`);
    }
    debugPrint(`[Parser] Favorite mangas: ${mangas.length}`);
    if (mangas.length === 0) {
      debugPrint("No favorite found");
    }
    return mangas;
  }

  parseDate(input: string) {
    const [date, time] = input.split(" ");
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year} ${time}`;
  }
}
