import { type Request, type SearchQuery, type SortingOption, URL } from "@paperback/types";
import type {
  ChapterResponse,
  GenresList,
  NovelBuddySearchMetadata,
  SearchResponse,
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

  async getChaptersList(mangaId: string, cv?: number) {
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
}
