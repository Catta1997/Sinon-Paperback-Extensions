import {
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  type Cookie,
  CookieStorageInterceptor,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SourceManga,
} from "@paperback/types";
import { MainInterceptor } from "./network";
import { Parser } from "./parsers";
import { type RokuMetadata } from "./utils";

const parser = new Parser();

type RokuHentaiImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  CloudflareBypassRequestProviding;

export class RokuHentaiExtension implements RokuHentaiImplementation {
  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 8,
    bufferInterval: 1,
    ignoreImages: true,
  });
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  mainInterceptor = new MainInterceptor("main");

  async initialise(): Promise<void> {
    this.mainRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }

  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name == "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parser.parseMangaDetails(mangaId);
  }

  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return parser.parseChapterDetails(chapter);
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return parser.parseChapters(sourceManga);
  }

  getSearchFilters(): Promise<SearchFilter[]> {
    return Promise.resolve(parser.getFilters());
  }

  getSearchResults(
    query: SearchQuery,
    metadata: RokuMetadata,
  ): Promise<PagedResults<SearchResultItem>> {
    return parser.parseSearchResult(query, metadata);
  }
}

export const RokuHentai = new RokuHentaiExtension();
