import { URL, PaperbackInterceptor, type Request, type Response } from "@paperback/types";
import { CompositeInterceptor } from "paperback-interceptors";
import {
  type ApiRequestConfig,
  type ChapterList,
  type ChapterPages,
  DOMAIN,
  type ElementInfo,
  type SearchResult,
  type SectionSeries,
} from "./model";

export class MainInterceptor extends PaperbackInterceptor {
  interceptors = new CompositeInterceptor([]);

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
    return this.interceptors.intercept(request, response, data);
  }
}

export class OmegaScansAPI {
  private async fetchApi<T>(request: Request): Promise<T> {
    const [, data] = await Application.scheduleRequest(request);

    try {
      return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
    } catch {
      throw new Error(`Failed to fetch data from ${request.url} (Invalid response)`);
    }
  }

  private async buildApiRequest<T>(api: ApiRequestConfig): Promise<T> {
    const url = new URL(DOMAIN);
    const paths = Array.isArray(api.path) ? api.path : [api.path];
    paths.forEach((p) => url.addPathComponent(p));
    if (api.query) {
      for (const [key, value] of Object.entries(api.query)) {
        url.setQueryItem(key, value);
      }
    }
    const request: Request = { url: url.toString(), method: "GET" };
    if (api.headers !== undefined) {
      request.headers = api.headers;
    }
    return this.fetchApi<T>(request);
  }

  getMangaInfo(mangaId: string) {
    const params: ApiRequestConfig = {
      path: ["series", mangaId],
    };
    return this.buildApiRequest<ElementInfo>(params);
  }

  getChaptersList(seriesId: string, page: number) {
    const params: ApiRequestConfig = {
      path: ["chapter", "query"],
      query: {
        page: page.toString(),
        perPage: "10000",
        series_id: seriesId.toString(),
      },
    };
    return this.buildApiRequest<ChapterList>(params);
  }

  getDiscovery(serisType: string, page: number, order: string) {
    const params: ApiRequestConfig = {
      path: ["query"],
      query: {
        page: page.toString(),
        series_type: serisType,
        perPage: "12",
        adult: "true",
        order: "desc",
        orderBy: order,
      },
    };
    return this.buildApiRequest<SectionSeries>(params);
  }
  /*
  async getNovel(mangaSlug: string, chapterSlug: string) {
    const url = `https://omegascans.org/series/${mangaSlug}/${chapterSlug}`;
    const html = await Application.scheduleRequest({url:url,method:"GET"})
    return Application.arrayBufferToUTF8String(html[1]);
  }
 */
  async getMangaPages(mangaSlug: string, chapterSlug: string) {
    const params: ApiRequestConfig = {
      path: ["chapter", `${mangaSlug}`, `${chapterSlug}`],
    };
    return this.buildApiRequest<ChapterPages>(params);
  }

  async getSearchResult(query: string, page: number) {
    const params: ApiRequestConfig = {
      path: ["query"],
      query: {
        adult: "true",
        query_string: query,
        page: page.toString(),
      },
    };
    return this.buildApiRequest<SearchResult>(params);
  }
}
