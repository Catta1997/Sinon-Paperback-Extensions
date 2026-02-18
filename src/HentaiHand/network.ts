import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";
import type { GetMangaInfo, JSONSearch, MangaDetails, TagParsing } from "./models";
import { DOMAIN } from "./main";

const BASE_API = `${DOMAIN}api`;
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
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: request.url,
        method: request.method ?? "GET",
      });
    }
    return data;
  }
}

export class ApiMaker {
  private checkResponseError(request: Request, response: Response): void {
    switch (response.status) {
      case 200:
        break;
      case 400:
        throw new Error("400 – Bad Request: The request was invalid.");
      case 401:
        throw new Error("401 – Unauthorized: Authentication is required.");
      case 404:
        throw new Error(`404 – Not Found: The resource ${response.url} was not found.`);
      case 408:
        throw new Error("408 – Request Timeout: The server took too long to respond.");
      case 429:
        throw new Error("429 – Too Many Requests: Rate limit exceeded.");
      case 500:
        throw new Error("500 – Internal Server Error: A server error occurred.");
      case 502:
        throw new Error("502 – Bad Gateway: Invalid response from upstream server.");
      case 504:
        throw new Error("504 – Gateway Timeout: Server response timed out.");
      case 403:
      case 503:
        throw new CloudflareError(request, "Error Code: " + response.status);
      default:
        throw new Error(`Unexpected HTTP error: ${response.status}`);
    }
  }

  private async getDataFromRequest(api: string): Promise<string> {
    const request = {
      url: api,
      method: "GET",
    };
    const [response, data] = await Application.scheduleRequest(request);
    this.checkResponseError(request, response);
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
