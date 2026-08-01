import { PaperbackInterceptor, URL, type Request, type Response } from "@paperback/types";
import type { GetMangaInfo, JSONSearch, MangaDetails, TagParsing } from "./models";

export const DOMAIN = "https://hentaihand.com/";
let BASE_API = `${DOMAIN}api`;
export class MainInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      ...request.headers,
      referer: DOMAIN,
      "user-agent": await Application.getDefaultUserAgent(),
    };
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return data;
  }
}

export class ApiMaker {
  private async getDataFromRequest(api: string): Promise<string> {
    const request = {
      url: api,
      method: "GET",
    };
    const [_, data] = await Application.scheduleRequest(request);
    return Application.arrayBufferToUTF8String(data);
  }

  async getJsonMangaInfoApi(mangaId: string) {
    const url = new URL(BASE_API).addPathComponent("comics");
    url.addPathComponent(mangaId);
    const html = await this.getDataFromRequest(url.toString());
    try {
      return JSON.parse(html) as MangaDetails;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getJsonSearchApi(keyword: string, page: number, language: string[], category: string[]) {
    const url = new URL(BASE_API).addPathComponent("comics");
    if (keyword.length > 0) url.setQueryItem("q", keyword);
    if (language.length > 0) url.setQueryItem("languages", language);
    if (category.length > 0) url.setQueryItem("categories", category);
    url.setQueryItem("per_page", "100");
    url.setQueryItem("page", page.toString());
    const html = await this.getDataFromRequest(url.toString());
    try {
      return JSON.parse(html) as JSONSearch;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getJsonChapPagesApi(chapterId: string) {
    const url = new URL(BASE_API).addPathComponent("comics");
    url.addPathComponent(chapterId);
    url.addPathComponent("images");
    const html = await this.getDataFromRequest(url.toString());
    try {
      return JSON.parse(html) as GetMangaInfo;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getJSONFilters(type: string) {
    const url = new URL(BASE_API).addPathComponent(type);
    const html = await this.getDataFromRequest(url.toString());
    return JSON.parse(html) as TagParsing;
  }
}
