import { type Request, type SortingOption, URL } from "@paperback/types";
import type { ApiRequestConfig, ChapterResponse, SearchResponse } from "./models";
import { load } from "cheerio";

export class NovelBuddyNetwork {
  constructor() {}

  private api = "https://api.novelbuddy.com/";
  private domain = "https://novelbuddy.com/";
  async search(page: number, query: string, sort: SortingOption) {
    const params: ApiRequestConfig = {
      page: page,
      limit: "24",
      query: query,
      sort: sort.id,
    };

    const url: URL = new URL(`${this.api}titles/search`);
    url.setQueryItem("q", params.query);
    url.setQueryItem("limit", params.limit);
    url.setQueryItem("page", params.page.toString());
    if (params.sort.length > 0) {
      url.setQueryItem("sort", params.sort);
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
    const request: Request = {
      url: `${this.domain}${url}`,
      method: "GET",
    };
    const response = await Application.scheduleRequest(request);
    const html = Application.arrayBufferToUTF8String(response[1]);
    const $ = load(html);
    return $.html($(".novel-tts-content"));
  }
}
