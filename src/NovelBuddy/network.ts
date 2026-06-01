import {type Request, URL} from "@paperback/types";
import type {ApiRequestConfig, SearchResponse} from "./models";
import {load} from "cheerio";

export class NovelBuddyNetwork {
  constructor() {}

  private api = "https://api.novelbuddy.com/";
  private domain = "https://novelbuddy.com/"
  async search(page: number, query?: string) {
    const params : ApiRequestConfig = {
      page: page,
      limit: "24",
      query: query ? query : "",
    };

    const url:URL = new URL(`${this.api}titles/search`);
    url.setQueryItem("q", params.query)
    url.setQueryItem("limit", params.limit)
    url.setQueryItem("page", params.page.toString())

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

  async getChapters(mangaId: string, cv?: number) {
    const request: Request = {
      url: `${this.api}titles/${mangaId}/chapters${cv ? `?cv=${cv}` : ""}`,
      method: "GET",
    };

    const response = await Application.scheduleRequest(request);
    const data = Application.arrayBufferToUTF8String(response[1]);
    return JSON.parse(data);
  }

  async getChapterPages(mangaId: string, chapterId: string) {
    const request: Request = {
      url: `${this.domain}${mangaId}/${chapterId}`,
      method: "GET",
    };
    const response = await Application.scheduleRequest(request);
    const html = Application.arrayBufferToUTF8String(response[1]);
    const $ = load(html);
    return $.html($(".novel-tts-content"))
  }
}
