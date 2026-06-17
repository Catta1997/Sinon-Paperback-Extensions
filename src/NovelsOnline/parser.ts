import {
  type Chapter,
  type ChapterDetails,
  ContentRating,
  type DiscoverSectionItem,
  type MangaInfo,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type Tag,
} from "@paperback/types";

import { load } from "cheerio";
import { BASE_URL } from "./main";
import { type Metadata, type ReqInit, type SearchMetadata } from "./models";
import { fixVoidElements } from "../novelUtils";

export class Parser {
  private async getCheerio(url: string, init?: ReqInit) {
    const req: Request = init
      ? { url: url, method: init.method, headers: init.headers, body: init.body }
      : { url: url, method: "GET" };
    const html = await Application.scheduleRequest(req);
    const response = Application.arrayBufferToUTF8String(html[1]);
    return load(response);
  }

  async parsePopular(metadata?: Metadata): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;

    const $ = await this.getCheerio(`${BASE_URL}/top-novel/${page}`);

    const items: DiscoverSectionItem[] = [];

    $(".top-novel-block").each((_, el) => {
      const title = $(el).find("h2").text().trim();

      const image = $(el).find(".top-novel-cover img").attr("src") ?? "";

      const mangaId = $(el).find("h2 a").attr("href")?.replace(BASE_URL, "");

      if (!mangaId) return;

      items.push({
        mangaId: mangaId,
        title: title,
        type: "prominentCarouselItem",
        imageUrl: image,
      });
    });

    return {
      items,
      metadata: {
        page: page + 1,
      },
    };
  }

  async parseSearch(
    query: SearchQuery<SearchMetadata>,
    _metadata?: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    const body = `keyword=${query.title}&search=1`;

    const $ = await this.getCheerio(`${BASE_URL}/detailed-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    });

    const items: SearchResultItem[] = [];

    $(".top-novel-block").each((_, el) => {
      const mangaId = $(el).find("h2 a").attr("href")?.replace(BASE_URL, "");

      if (!mangaId) return;

      items.push({
        mangaId,
        title: $(el).find("h2").text().trim(),
        imageUrl: $(el).find(".top-novel-cover img").attr("src") ?? "",
        contentRating: ContentRating.EVERYONE,
      });
    });

    return {
      items: items,
      metadata: undefined,
    };
  }

  async parseMangaDetails(mangaId: string): Promise<SourceManga> {
    const $ = await this.getCheerio(`${BASE_URL}${mangaId}`);

    const manga: MangaInfo = {
      contentRating: ContentRating.EVERYONE,
      contentType: "novel",
      secondaryTitles: [],
      primaryTitle: $("h1").text().trim() ?? "Untitled",
      thumbnailUrl: $(".novel-cover img").attr("src") ?? "",
      synopsis: "",
      author: "",
      tagGroups: [],
    };
    let authors: string[] = [];
    let names: string[] = [];
    let artists: string[] = [];
    let genreTags: Tag[] = [];
    let tagsTags: Tag[] = [];
    $(".novel-detail-item").each((_, el) => {
      const label = $(el).find("h6").text().trim();
      const detail = $(el).find(".novel-detail-body");
      switch (label) {
        case "Description":
          manga.synopsis = detail.text().trim();
          break;
        case "Genre":
          genreTags = detail
            .find("li")
            .map((genreIndex, li) => ({
              title: $(li).text().trim(),
              id: `genre_${genreIndex.toString()}`,
            }))
            .get()
            .filter((genre) => genre.title !== "N/A");
          break;
        case "Tags":
          tagsTags = detail
            .find("li")
            .map((tagIndex, li) => ({
              title: $(li).text().trim(),
              id: `tags_${tagIndex.toString()}`,
            }))
            .get()
            .filter((tag) => tag.title !== "N/A");
          break;
        case "Author(s)":
          authors = detail
            .find("li")
            .map((_, li) => $(li).text().trim())
            .get()
            .filter((name) => name !== "N/A");
          break;
        case "Artist(s)":
          artists = detail
            .find("li")
            .map((_, li) => $(li).text().trim())
            .get()
            .filter((name) => name !== "N/A");
          break;

        case "Status":
          manga.status = detail.text().trim();
          break;

        case "Alternative Names":
          names = detail
            .find("li")
            .map((_, li) => $(li).text().trim())
            .get()
            .filter((name) => name !== "N/A");
          break;
      }
      manga.secondaryTitles = names;
      manga.tagGroups = [
        {
          id: "genres",
          title: "Genre",
          tags: genreTags,
        },
        {
          id: "tags",
          title: "Tags",
          tags: tagsTags,
        },
      ];
      manga.author = [...authors, ...artists].join(",");
    });
    return { mangaId: mangaId, mangaInfo: manga };
  }

  async parseChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const $ = await this.getCheerio(`${BASE_URL}${sourceManga.mangaId}`);
    const chapters: Chapter[] = [];
    let lastValidChapterNumber = -1;
    let lastValidVolumeNumber = -1;
    $("ul.chapter-chs > li > a").each((i, el) => {
      const url = $(el).attr("href") ?? "";
      const chapterId = url.replace(BASE_URL, "");
      const title = $(el).text().trim();
      const parsed = Number(title.split(" ")[1]);
      const volume = Number(url.match(/\/volume-(\d+)\//)?.[1] ?? 0);
      if (volume > lastValidVolumeNumber) {
        lastValidVolumeNumber = volume;
        lastValidChapterNumber = -1;
      }
      const num = Number.isNaN(parsed) ? lastValidChapterNumber + 1 : parsed;
      lastValidChapterNumber = Math.floor(num);
      chapters.push({
        chapNum: num,
        volume: volume,
        sortingIndex: i,
        langCode: "en",
        chapterId: chapterId ?? "",
        sourceManga: sourceManga,
        title: title,
      });
    });
    return chapters.reverse();
  }

  async parseChapter(chapter: Chapter): Promise<ChapterDetails> {
    const $ = await this.getCheerio(`${BASE_URL}${chapter.chapterId}`);
    const content = $("#contentall");
    const html = $.html(content);
    const contentDiv = fixVoidElements(html)
      .replaceAll(/\u00a0/g, " ")
      .replaceAll("&nbsp;", " ");
    return {
      type: "html",
      id: chapter.chapterId,
      mangaId: chapter.chapterId,
      html: `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${contentDiv}</body></html>`,
    };
  }
}
