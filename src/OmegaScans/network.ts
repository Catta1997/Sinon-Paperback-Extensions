import {
  URL,
  PaperbackInterceptor,
  type Request,
  type Response,
  type SearchQuery,
  type SortingOption,
} from "@paperback/types";
import { CompositeInterceptor } from "paperback-interceptors";
import {
  type ApiRequestConfig,
  type ChapterList,
  type ChapterPages,
  API,
  type ElementInfo,
  type NovelContent,
  type OmegaScansSearchMetadata,
  type SearchResult,
  type Tags,
  type Trending,
} from "./model";

export class MainInterceptor extends PaperbackInterceptor {
  interceptors = new CompositeInterceptor([]);

  override async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      ...request.headers,
      referer: API,
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
    const url = new URL(API);
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
    return this.buildApiRequest<SearchResult>(params);
  }
  async getNovel(mangaSlug: string, chapterSlug: string) {
    const params: ApiRequestConfig = {
      path: ["chapter", `${mangaSlug}`, `${chapterSlug}`],
    };
    return this.buildApiRequest<NovelContent>(params);
  }
  async getMangaPages(mangaSlug: string, chapterSlug: string) {
    const params: ApiRequestConfig = {
      path: ["chapter", `${mangaSlug}`, `${chapterSlug}`],
    };
    return this.buildApiRequest<ChapterPages>(params);
  }

  async getSearchResult(
    query: SearchQuery<OmegaScansSearchMetadata>,
    page: number,
    sortingOption: SortingOption,
  ) {
    const [sort, order] = sortingOption.id.split("$");
    const params: ApiRequestConfig = {
      path: ["query"],
      query: {
        adult: "true",
        query_string: query.title,
        page: page.toString(),
        ...(order.length ? { order: order } : {}),
        ...(sort.length ? { orderBy: sort } : {}),
        ...(query.metadata?.tags_ids?.length
          ? { tags_ids: `[${query.metadata.tags_ids.join(",")}]` }
          : {}),
        ...(query.metadata?.series_type ? { series_type: query.metadata.series_type } : {}),
      },
    };
    return this.buildApiRequest<SearchResult>(params);
  }

  async getTrending(type: string) {
    const params: ApiRequestConfig = {
      path: ["trending"],
      query: {
        type: type,
      },
    };
    return this.buildApiRequest<Trending[]>(params);
  }

  async getTags() {
    const params: ApiRequestConfig = {
      path: ["tags"],
    };
    return this.buildApiRequest<Tags[]>(params);
  }
}
