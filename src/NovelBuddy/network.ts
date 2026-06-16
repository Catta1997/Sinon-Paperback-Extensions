import {
  ContentRating,
  type DiscoverSectionItem,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SortingOption,
  URL,
} from "@paperback/types";
import type {
  ChapterResponse,
  GenresList,
  NovelBuddySearchMetadata,
  PopularChapter,
  PopularNovel,
  SearchResponse,
  SectionResponse,
} from "./models";
import { load } from "cheerio";
import { fixVoidElements } from "../novelUtils";

export class NovelBuddyNetwork {
  constructor() {}

  private api = "https://api.novelbuddy.com/";
  private domain = "https://novelbuddy.com/";
  getGenresData(genres: Record<string, "included" | "excluded">) {
    return Object.entries(genres).reduce(
      (acc, [genre, status]) => {
        if (status === "included") {
          acc.included.push(genre);
        } else {
          acc.excluded.push(genre);
        }
        return acc;
      },
      {
        included: [] as string[],
        excluded: [] as string[],
      },
    );
  }
  async search(page: number, query: SearchQuery<NovelBuddySearchMetadata>, sort: SortingOption) {
    const genres = this.getGenresData(query.metadata?.genres ?? {});

    const url: URL = new URL(`${this.api}titles/search`);
    if (query.title.length > 1) {
      url.setQueryItem("q", query.title);
    }
    url.setQueryItem("limit", "24");
    url.setQueryItem("page", page.toString());
    if (genres.included.length > 0) {
      url.setQueryItem("genres", genres.included.join(","));
    }
    if (genres.excluded.length > 0) {
      url.setQueryItem("exclude", genres.excluded.join(","));
    }
    url.setQueryItem("status", query.metadata?.status ?? []);
    url.setQueryItem("demographic", query.metadata?.demographic ?? []);
    if (sort.id.length > 0) {
      url.setQueryItem("sort", sort.id);
    }
    const request: Request = {
      url: url.toString(),
      method: "GET",
    };

    const response = await Application.scheduleRequest(request);
    const data = Application.arrayBufferToUTF8String(response[1]);
    return JSON.parse(data) as SearchResponse;
  }

  async getNovel(id: string) {
    const request: Request = {
      url: `https://novelbuddy.com/${id}`,
      method: "GET",
    };

    const response = await Application.scheduleRequest(request);
    return Application.arrayBufferToUTF8String(response[1]);
  }

  async getChaptersList(mangaId: string, cv?: string) {
    const request: Request = {
      url: `${this.api}titles/${mangaId}/chapters${cv ? `?cv=${cv}` : ""}`,
      method: "GET",
    };

    const response = await Application.scheduleRequest(request);
    const data = Application.arrayBufferToUTF8String(response[1]);
    return JSON.parse(data) as ChapterResponse;
  }

  async getChapterPages(url: string) {
    url = url.replace("//", "/");
    const request: Request = {
      url: `${this.domain}${url}`,
      method: "GET",
    };
    const response = await Application.scheduleRequest(request);
    const html = Application.arrayBufferToUTF8String(response[1]);
    const $ = load(html);
    const content = $(".novel-tts-content");
    const htmlDiv = $.html(content);
    return fixVoidElements(htmlDiv)
      .replaceAll(/\u00a0/g, " ")
      .replaceAll("&nbsp;", " ");
  }

  async getGenres() {
    const request: Request = {
      url: `${this.api}genres`,
      method: "GET",
    };

    const response = await Application.scheduleRequest(request);
    const data = Application.arrayBufferToUTF8String(response[1]);
    return JSON.parse(data) as GenresList;
  }

  async getSections<T>(section: string) {
    const url = `${this.api}trending/${section}`;
    const response = await Application.scheduleRequest({ url: url, method: "GET" });
    const data = Application.arrayBufferToUTF8String(response[1]);
    return JSON.parse(data) as SectionResponse<T>;
  }
  async parsePopular(): Promise<PagedResults<DiscoverSectionItem>> {
    const novels = await this.getSections<PopularNovel>("titles");
    return {
      items: novels.data.items.map((novel) => ({
        type: "featuredCarouselItem",
        mangaId: novel.url.replace(/^\//, ""),
        imageUrl: novel.cover,
        title: novel.name,
        infoItems: [{ symbol: "star", text: novel.rating.toString() }],
        contentRating: novel.isAdult === true ? ContentRating.ADULT : ContentRating.EVERYONE,
      })),
    };
  }
  async parseChapters(): Promise<PagedResults<DiscoverSectionItem>> {
    const novels = await this.getSections<PopularChapter>("chapters");
    return {
      items: novels.data.items.map((novel) => ({
        type: "chapterUpdatesCarouselItem",
        chapterId: novel.chapter.id,
        mangaId: novel.title.url.replace(/^\//, ""),
        subtitle: `Chapter ${novel.chapter.chapter_number}`,
        imageUrl: novel.title.cover,
        title: novel.title.name,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }
}
