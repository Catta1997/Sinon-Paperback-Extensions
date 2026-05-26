import { URL, type Request, type SearchQuery, type SortingOption } from "@paperback/types";

import {
  API,
  type ApiRequestConfig,
  type ChapterPagesAPI,
  DOMAIN,
  type MangaChapterListAPI,
  type MangaInfoAPI,
  type SearchInfoAPI,
  type SearchSuggestionsAPI,
  type Volumes,
} from "./models";
import {
  deNormalizeId,
  type BaseMetadata,
  getShowAdultStatus,
  getSectionContentTypes,
} from "./utils";

export class MangaDotApi {
  private async fetchAPI<T>(api: ApiRequestConfig): Promise<T> {
    const url = new URL(API);
    const paths = Array.isArray(api.path) ? api.path : [api.path];
    paths.forEach((p) => url.addPathComponent(p));
    if (api.query !== undefined) {
      for (const [key, value] of Object.entries(api.query)) {
        url.setQueryItem(key, value);
      }
    }
    const html = await this.getDataFromRequest(url, api.referer);
    return JSON.parse(html) as T;
  }
  private async getDataFromRequest(apiLink: URL, referer?: string): Promise<string> {
    const request: Request = {
      url: apiLink.toString(),
      method: "GET",
    };
    if (referer) {
      request.headers = { referer: referer };
    }
    const data = await Application.scheduleRequest(request);
    return Application.arrayBufferToUTF8String(data[1]);
  }

  private generateSectionAPI(sectionId: string, page: number): ApiRequestConfig {
    return {
      path: ["manga", "section", sectionId],
      query: {
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        adult: getShowAdultStatus() ? "both" : "0",
        page: page.toString(),
      },
    };
  }

  async getJsonSectionApi(section: string, page: number): Promise<SearchInfoAPI> {
    const sections: Record<string, ApiRequestConfig> = {
      latest_updates: this.generateSectionAPI("latest-updates", page),
      recently_added: this.generateSectionAPI("recently-added", page),
      most_tracked: this.generateSectionAPI("most-tracked", page),
      top_rated: this.generateSectionAPI("top-rated", page),
    };
    const config = sections[section];
    if (!config) throw new Error(`${section} not found on API`);
    return this.fetchAPI<SearchInfoAPI>(config);
  }
  async getJsonMangaInfoApi(mangaId: string) {
    return this.fetchAPI<MangaInfoAPI>({
      path: ["manga", `${mangaId}`],
      query: {},
    });
  }

  async getJsonChapterListApi(mangaId: string) {
    return this.fetchAPI<MangaChapterListAPI[]>({
      path: ["manga", `${mangaId}`, "chapters", "list"],
      query: {},
    });
  }

  async getJsonVolumesApi(mangaId: string) {
    return this.fetchAPI<Volumes[]>({
      path: ["manga", `${mangaId}`, "volumes"],
      query: {},
    });
  }

  async getJsonSearchApi(query: SearchQuery<BaseMetadata>, page: number, sorting: SortingOption) {
    const genres = query.metadata?.genres ?? [];
    const formattedGenres = Object.entries(genres).map(([genre, state]) => {
      const normalized = deNormalizeId(genre);
      return state === "excluded" ? `-${normalized}` : normalized;
    });
    const statuses = query.metadata?.status ?? [];
    const origins = query.metadata?.origin ?? [];
    const authors = query.metadata?.author ?? [];
    const artist = query.metadata?.artist ?? [];
    const adult = query.metadata?.adult === true ? "both" : "0";
    const [sort, order] = sorting.id.split("$");
    return this.fetchAPI<SearchInfoAPI>({
      path: ["search"],
      query: {
        search: query.title,
        page: page.toString(),
        genres: formattedGenres.join(","),
        origin: origins.join(",").replaceAll("&", ","),
        status: statuses.join(","),
        author: authors.join(","),
        artist: artist.join(","),
        sortBy: sort,
        sortOrder: order ? order : "",
        adult: adult,
      },
    });
  }

  async getJsonChapPagesApi(chapterId: string, mangaId: string, upload: string | undefined) {
    const chapPath = upload === "trusted" ? "uploads" : "chapters";
    return this.fetchAPI<ChapterPagesAPI>({
      path: [`${chapPath}`, `${chapterId}`, "images"],
      referer: `${DOMAIN}/manga/${mangaId}`,
    });
  }

  async getFilters() {
    return this.fetchAPI<string[]>({
      path: ["manga", "genres"],
    });
  }

  async getAuthor(value: string) {
    return this.fetchAPI<SearchSuggestionsAPI>({
      path: ["manga", "people-suggest"],
      query: { kind: "author", q: value },
    });
  }

  async getArtist(value: string) {
    return this.fetchAPI<SearchSuggestionsAPI>({
      path: ["manga", "people-suggest"],
      query: { kind: "artist", q: value },
    });
  }
}
