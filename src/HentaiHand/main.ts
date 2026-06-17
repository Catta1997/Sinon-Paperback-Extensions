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
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SourceManga,
} from "@paperback/types";
import { MainInterceptor } from "./network";
import { JsonParser } from "./parsers";

const parse = new JsonParser();
type HentaiHandImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  CloudflareBypassRequestProviding;

export class HentaiHandExtension implements HentaiHandImplementation {
  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainInterceptor = new MainInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
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

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name == "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  getSearchResults(query: SearchQuery<{}>): Promise<PagedResults<SearchResultItem>> {
    return parse.parseSearchResults(query);
  }

  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parse.parseMangaDetails(mangaId);
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return parse.parseChapters(sourceManga);
  }
  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return parse.parseChapterDetails(chapter.chapterId);
  }
}

export const HentaiHand = new HentaiHandExtension();
