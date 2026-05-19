import {
  API,
  type ApiRequestConfig,
  type ChapterPagesAPI,
  DOMAIN,
  type MangaChapterListAPI,
  type MangaInfoAPI,
  type SearchInfoAPI,
  type SearchSuggestionsAPI,
} from "./models";
import { URL, type Request, type SearchQuery, type SortingOption } from "@paperback/types";
import {
  deNormalizeId,
  type BaseMetadata,
  getShowAdultStatus,
  getSectionContentTypes,
} from "./utils";

export class MangaDotApi {
  apiLink = "";

  constructor() {}
  private async APIJson<T>(api: ApiRequestConfig): Promise<T> {
    const url = new URL(API);
    const paths = Array.isArray(api.path) ? api.path : [api.path];
    paths.forEach((p) => url.addPathComponent(p));
    if (api.query !== undefined) {
      for (const [key, value] of Object.entries(api.query)) {
        url.setQueryItem(key, value);
      }
    }
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest(api.referer);
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
  async getJsonSectionApi(section: string, page: number): Promise<SearchInfoAPI> {
    const sections: Record<string, ApiRequestConfig> = {
      latest_updates: {
        path: ["manga", "section", "latest-updates"],
        query: {
          origin: getSectionContentTypes().join(",").replaceAll("&", ","),
          adult: getShowAdultStatus() ? "both" : "0",
          page: page.toString(),
        },
      },
      recently_added: {
        path: ["manga", "section", "recently-added"],
        query: {
          origin: getSectionContentTypes().join(",").replaceAll("&", ","),
          adult: getShowAdultStatus() ? "both" : "0",
          page: page.toString(),
        },
      },
      most_tracked: {
        path: ["manga", "section", "most-tracked"],
        query: {
          origin: getSectionContentTypes().join(",").replaceAll("&", ","),
          adult: getShowAdultStatus() ? "both" : "0",
          page: page.toString(),
        },
      },
      top_rated: {
        path: ["manga", "section", "top-rated"],
        query: {
          origin: getSectionContentTypes().join(",").replaceAll("&", ","),
          adult: getShowAdultStatus() ? "both" : "0",
          page: page.toString(),
        },
      },
    };
    const config = sections[section];
    if (!config) throw new Error(`${section} not found on API`);
    return this.APIJson<SearchInfoAPI>({ path: config.path, query: config.query });
  }
  async getJsonMangaInfoApi(mangaId: string) {
    return this.APIJson<MangaInfoAPI>({
      path: ["manga", `${mangaId}`],
      query: {},
    });
  }

  async getJsonChapterListApi(mangaId: string) {
    return this.APIJson<MangaChapterListAPI[]>({
      path: ["manga", `${mangaId}`, "chapters", "list"],
      query: {},
    });
  }

  async getJsonSearchApi(query: SearchQuery<BaseMetadata>, page: number, sorting: SortingOption) {
    let genres = query.metadata?.genres ?? [];
    const formattedGenres = Object.entries(genres).map(([genre, state]) => {
      const normalized = deNormalizeId(genre);
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
    let authors = query.metadata?.author ?? [];
    const [sort, order] = sorting.id.split("$");
    return this.APIJson<SearchInfoAPI>({
      path: ["search"],
      query: {
        search: query.title,
        page: page.toString(),
        genres: formattedGenres.join(","),
        origin: formattedOrigin.join(",").replaceAll("&", ","),
        status: formattedStatus.join(","),
        author: authors.join(","),
        sortBy: sort,
        sortOrder: order ? order : "",
      },
    });
  }

  async getJsonChapPagesApi(chapterId: string, mangaId: string, upload: string | undefined) {
    const chapPath = upload === "0" ? "chapters" : "uploads";
    return this.APIJson<ChapterPagesAPI>({
      path: [`${chapPath}`, `${chapterId}`, "images"],
      referer: `${DOMAIN}/manga/${mangaId}`,
    });
  }

  async getFilters() {
    return this.APIJson<string[]>({
      path: ["manga", "genres"],
    });
  }

  async getAuthor(value: string) {
    return this.APIJson<SearchSuggestionsAPI>({
      path: ["manga", "people-suggest"],
      query: { kind: "author", q: value },
    });
  }

  async getArtist(value: string) {
    return this.APIJson<SearchSuggestionsAPI>({
      path: ["manga", "people-suggest"],
      query: { kind: "artist", q: value },
    });
  }
}
