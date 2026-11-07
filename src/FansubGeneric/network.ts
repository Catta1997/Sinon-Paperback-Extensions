import {
  PaperbackInterceptor,
  type SearchQuery,
  URL,
  type Request,
  type Response,
} from "@paperback/types";
import type {
  BaseMetadata,
  ComicDetailResponse,
  ComicsListResponse,
  ReadChapterResponse,
} from "./models";

export class MainInterceptor extends PaperbackInterceptor {
  private readonly base_url: string = "";
  constructor(base_url: string, id: string) {
    super(id);
    this.base_url = base_url;
  }

  override async interceptRequest(request: Request): Promise<Request> {
    return {
      url: request.url.replace("http://", "https://"),
      method: request.method,
    };
  }
  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return data;
  }
}

export class APIRequests {
  apiBaseUrl: string;
  constructor(baseUrl: string) {
    this.apiBaseUrl = baseUrl;
  }

  /** GET `<apiBaseUrl>/<...pathComponents>` and parse the body as JSON. */
  private async getJson<T>(...pathComponents: string[]): Promise<T> {
    const url = new URL(this.apiBaseUrl);
    pathComponents.forEach((component) => url.addPathComponent(component));
    const [, data] = await Application.scheduleRequest({ url: url.toString(), method: "GET" });
    return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
  }

  apiSearchResult(query: SearchQuery<BaseMetadata>) {
    return this.getJson<ComicsListResponse>(
      query.title.length > 0 ? "search" : "comics",
      query.title,
    );
  }

  apiMangaDetails(mangaId: string) {
    return this.getJson<ComicDetailResponse>("comics", mangaId);
  }

  apiLatestComics() {
    return this.getJson<ComicsListResponse>("comics");
  }

  async getChapterPages(chapterId: string) {
    const json = await this.getJson<ReadChapterResponse>(chapterId);
    return json.chapter.pages;
  }
}
