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
      .each((i, el) => {
        const container = $(el);
        const title = container.find("div.glink").text().trim();
        const url = container.find("a").first().attr("href") ?? "";
        const image = container.find("img").attr("src") ?? "";
        const category = container.find(".gl3e .cn").text().trim();
        const date = container.find("div[id^='posted_']").text().trim();
        const pages = container
          .find(".gl3e > div")
          .filter((_, el) => $(el).text().trim().endsWith("pages"))
          .first()
          .text()
          .trim();
        let artist = "";
        let rating = 0;
        const style = container.find("div.ir").attr("style") ?? "";
        const match = style.match(/background-position:\s*(-?\d+)px\s+(-?\d+)px/);
        if (match) {
          const x = parseInt(match[1], 10); // 0
          const y = Math.abs(parseInt(match[2], 10)); // 21
          const xIndex = (x + 80) / 16;
          const yOffset = Math.abs(y) === 21 ? 0.5 : 0;
          rating = xIndex - yOffset;
        }
        let lang = `Japanese ${getLangFlag("japanese")}`;
        container.find("td.tc").each((i, td) => {
          if ($(td).text().trim() === "artist:") {
            artist = $(td).next("td").find("div").first().text().trim();
          }
          if ($(td).text().trim() === "language:") {
            const langTexts = $(td)
              .next("td")
              .find("div.gt, div.gtl")
              .map((_, el) => $(el).text().trim())
              .get()
              .filter((text) => text && text.toLowerCase() !== "translated");
            lang = langTexts
              .map((text) => `${text} ${getLangFlag(text)}`)
              .filter(Boolean)
              .join(" ");
          }
        });
        const subtitle = capitalLetter(
          [lang, artist].filter((v) => v.trim().length > 0).join(" | "),
        );
        results.push({
          title: title,
          image: image,
          url: url,
          lang: lang,
          artist: artist,
          subtitle: subtitle,
          pages: pages,
          category: category,
          date: date,
          rating: rating,
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
    let html = "";
    if (query.metadata?.favoriteID && query.metadata.favoriteID.length > 0) {
      html = await network.favoriteRequest(query.metadata.favoriteID);
    } else {
      html = await network.searchRequest(query, metadata);
    }
    const $ = cheerio.load(html);
    const results: SearchResultItem[] = this.parseTable($).map((item) => ({
      mangaId: item.url?.replaceAll(`${BASE_URL}/g/`, "") ?? "",
      title: this.parseTitle(item.title),
      imageUrl: item.image,
      subtitle: item.subtitle,
      contentRating: ContentRating.ADULT,
    }));
    if (getDebugMode()) {
      throw new Error(`results: ${results.length}`);
    }
    if (results.length === 0) {
      return {
        items: [],
        metadata: undefined,
      };
    }
    let nextValue = "";
    const nextEl = $("#unext");
    if (nextEl.is("a")) {
      const href = nextEl.attr("href") ?? "";
      const match = href.match(/next=([^&]+)/);
      nextValue = match && match[1] ? match[1] : "";
    }
    return {
      items: results,
      metadata: nextValue.length > 0 ? { page: nextValue } : undefined,
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

  async parseMangaDetail(mangaID: string): Promise<SourceManga> {
    const html = await network.mangaDetailRequest(mangaID);
    const $ = cheerio.load(html);
    let artist = "";
    const additionalMangaInfo = this.parseGalleryInfo($);
    const tagSectionList: TagSection[] = [];
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
    let languages: string[] = [];
    $("#taglist tr").each((i, el) => {
      const row = $(el);

      const category = row.find("td.tc").text().trim().split(":")[0];

      const tags: Tag[] = row
        .find('td div[class^="gt"] > a')
        .map((i, a) => ({
          id: $(a).attr("id") ?? "",
          title: capitalLetter($(a).text().trim().replaceAll(/\s+/g, " ").trim()),
        }))
        .get();
      const artistTag = tags.find((tag) => tag.id.includes("ta_artist"));
      if (artistTag) {
        artist = artistTag.title;
      }
      if (category !== "artist" && category !== "language") {
        tagSectionList.push({
          id: category ?? "",
          title: capitalLetter(category ?? ""),
          tags: tags,
        });
      }
      if (category === "language") {
        tags.map((t) => {
          if (t.title !== "Translated") {
            if (getLangFlag(t.title.toLowerCase()).length > 0) {
              languages.push(`${t.title} ${getLangFlag(t.title.toLowerCase())}`);
            }
          }
        });
      }
    });
    const style = $("#gd1 > div").attr("style") ?? "";
    const match = style.match(/url\(([^)]+)\)/);
    const imageUrl = match ? match[1] : "";
    const title = $("#gn").text().trim();
    const secondaryTitle = $("#gj").text().trim();
    const updateTime = additionalMangaInfo.posted.replaceAll(" ", "T");
    const info: MangaInfo = {
      thumbnailUrl: imageUrl ?? "",
      synopsis: "",
      artist: capitalLetter(artist),
      rating: additionalMangaInfo.rating.average / 500,
      secondaryTitles: [this.parseTitle(secondaryTitle)],
      primaryTitle: this.parseTitle(title),
      contentRating: ContentRating.ADULT,
      tagGroups: tagSectionList,
      additionalInfo: {
        title: this.parseTitle(title).split("| ")[1] ?? "",
        pages: additionalMangaInfo.length.pages.toString(),
        language: languages.join(" | "),
        uploaded: updateTime,
        favorite: additionalMangaInfo.favs.text.replaceAll("times", "favorite"),
      },
      shareUrl: `https://e-hentai.org/g/${mangaID}`,
    };
    return { mangaId: mangaID, mangaInfo: info };
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
  private getRow($: cheerio.CheerioAPI, label: string): string {
    return $(`#gdd .gdt1:contains("${label}")`).next(".gdt2").text().trim();
  }
  private parseGalleryInfo($: cheerio.CheerioAPI): GalleryInfo {
    const root = $("#gmid #gd3");
    const category = root.find("#gdc div").first().text().trim();
    let uploaderName = root.find("#gdn a").first().text().trim();
    const tags = $("#gmid #gd4");
    tags.find("td.tc").each((i, td) => {
      if ($(td).text().trim() === "artist:") {
        uploaderName = $(td).next("td").find("div").first().text().trim();
      }
    });
    const posted = this.getRow($, "Posted:");
    const lengthRaw = this.getRow($, "Length:");
    const favsRaw = this.getRow($, "Favorited:");
    const ratingAverage =
      parseFloat($("#rating_label").text().replaceAll("Average:", "").replaceAll(".", "").trim()) ??
      0.0;
    return {
      category: category,
      uploader: {
        name: uploaderName,
      },
      posted: posted,
      length: {
        pages: parseInt(lengthRaw),
      },
      favs: {
        text: favsRaw,
      },
      rating: {
        average: isNaN(ratingAverage) ? 0.0 : ratingAverage,
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
    } // return [];
    const IMAGES_PER_PAGE = 20;
    const totalPages = Math.ceil(totalImages / IMAGES_PER_PAGE);
    const pageUrls = Array.from(
      { length: totalPages },
      (_, page) => `${BASE_URL}/g/${chapter.chapterId}?p=${page}`,
    );
    const htmlPages = await Promise.all(pageUrls.map((url) => network.getChapterPages(url)));
    const results: string[] = [];

    for (const html of htmlPages) {
      const $ = cheerio.load(html);
      $(`a[href^="${BASE_URL}/s/"]`).each((_, el) => {
        if (results.length >= totalImages) return false;
        const url = $(el).attr("href");
        if (url) results.push(url);
      });
      if (results.length >= totalImages) break;
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
    let nextValue = "";
    const mangas: SourceManga[] = [];
    do {
      const $ = cheerio.load(html);
      const results = this.parseTable($).map((item) => ({
        mangaId: item.url ? item.url.replaceAll(`${BASE_URL}/g/`, "") : "",
        title: this.parseTitle(item.title),
      }));
      if (results.length === 0) {
        return mangas;
      }
      for (const item of results) {
        mangas.push(await this.parseMangaDetail(item.mangaId));
      }
      const nextEl = $("#unext");
      if (nextEl.is("a")) {
        const href = nextEl.attr("href") ?? "";
        const match = href.match(/next=([^&]+)/);
        nextValue = match && match[1] ? match[1] : "";
      }
      html = `${html}/${nextValue}`;
    } while (nextValue.length > 0);
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
