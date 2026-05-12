import {
  API,
  type ApiRequestConfig,
  type BaseMetadata,
  type ChapterPagesAPI,
  DOMAIN,
  type MangaChapterListAPI,
  type MangaInfoAPI,
  type MangaSectionAPI,
  type SearchInfoAPI,
} from "./models";
import { URL, type Request, type SearchQuery, type Metadata } from "@paperback/types";
import {deNormalizeId, normalizeId} from "./utils";

export class MangaDotApi {
  apiLink = "";

  constructor() {}
  private async APIJson<T>(api: ApiRequestConfig): Promise<T> {
    const url = new URL(API);
    const paths = Array.isArray(api.path) ? api.path : [api.path];
    paths.forEach((p) => url.addPathComponent(p));
    if (api.query) {
      for (const [key, value] of Object.entries(api.query)) {
        url.setQueryItem(key, value);
      }
    }
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest();
    return JSON.parse(html) as T;
  }
  private async getDataFromRequest(referer?: string): Promise<string> {
    const request: Request = {
      url: this.apiLink,
      method: "GET",
    };
    if (referer) {
      request.headers = { referer: referer };
    }
    const data = await Application.scheduleRequest(request);
    return Application.arrayBufferToUTF8String(data[1]);
  }
  private buildApiPath(api: ApiRequestConfig): string {
    const parts = (Array.isArray(api.path) ? api.path : [api.path]).join("/");
    const qs = api.query
      ? Object.entries(api.query)
          .flatMap(([k, v]) =>
            (Array.isArray(v) ? v : [v]).map(
              (x) => `${encodeURIComponent(k)}=${encodeURIComponent(x)}`,
            ),
          )
          .join("&")
      : "";
    return "/" + parts + (qs ? "?" + qs : "");
  }
  async getJsonSectionApi(section: string): Promise<MangaSectionAPI> {
    const sections: Record<string, ApiRequestConfig> = {
      latest_updates: {
        path: ["manga", "section"],
        query: {
          id: "latest_updates",
          origin: "KR,CN,TW",
          adult: "0",
        },
      },
      recently_added: {
        path: ["manga", "section"],
        query: {
          id: "recently_added",
          origin: "KR,CN,TW",
          adult: "0",
        },
      },
      most_tracked: {
        path: ["manga", "section"],
        query: {
          id: "most_tracked",
          origin: "KR,CN,TW",
          adult: "0",
        },
      },
      top_rated: {
        path: ["manga", "section"],
        query: {
          id: "top_rated",
          origin: "KR,CN,TW",
          adult: "0",
        },
      },
    };
    const config = sections[section];
    if (!config) throw new Error(`${section} not found on API`);
    return this.APIJson<MangaSectionAPI>({ path: config.path, query: config.query });
  }
  async getJsonMangaInfoApi(mangaId: string) {
    return this.APIJson<MangaInfoAPI>({
      path: ["manga", mangaId],
      query: {},
    });
  }

  async getJsonChapterListApi(mangaId: string) {
    return this.APIJson<MangaChapterListAPI[]>({
      path: ["manga", mangaId, "chapters", "list"],
      query: {},
    });
  }

  async getJsonSearchApi(query: SearchQuery<BaseMetadata>, page: number) {
    let genres = query.metadata?.genres ?? [];
    const formattedGenres = Object.entries(genres).map(([genre, state]) => {
      const normalized = deNormalizeId(genre)
      return state === "excluded" ? `-${normalized}` : normalized;
    });
    let statuses = query.metadata?.status ?? [];
    const formattedStatus = Object.entries(statuses).map(([status, state]) => {
      return state === "excluded" ? `-${status}` : status;
    });
    let origins = query.metadata?.origin ?? [];
    const formattedOrigin = Object.entries(origins).map(([origin, state]) => {
      return state === "excluded" ? `-${origin}` : origin;
    });
    return this.APIJson<SearchInfoAPI>({
      path: ["search"],
      query: {
        search: query.title,
        page: page.toString(),
        genres: formattedGenres.join(","),
        origin: formattedOrigin.join(","),
        status: formattedStatus.join(","),
      },
    });
  }

  async getJsonChapPagesApi(chapterId: string, mangaId: string) {
    return this.APIJson<ChapterPagesAPI>({
      path: ["uploads", chapterId, "images"],
      query: {},
      referer: `${DOMAIN}/manga/${mangaId}`,
    });
  }

  async getFilters() {
    return this.APIJson<string[]>({
      path: ["manga", "genres"],
      query: {},
    });
  }
}
