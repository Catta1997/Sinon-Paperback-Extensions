import {
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  CookieStorageInterceptor,
  type ExtensionImpl,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";
import { DOMAIN, MainInterceptor } from "./network";
import { JsonParser } from "./parsers";
import { CloudflareInterceptor, HttpErrorInterceptor } from "paperback-interceptors";
import type basePbConfig from "./pbconfig";

const parse = new JsonParser();

export class HentaiHandExtension implements ExtensionImpl<typeof basePbConfig> {
  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainInterceptor = new MainInterceptor("main");
  cloudFlareInterceptor = new CloudflareInterceptor({ url: DOMAIN }, "cloudflare");
  httpError = new HttpErrorInterceptor("httpCode");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  async initialise(): Promise<void> {
    this.mainRateLimiter.registerInterceptor();
    this.cloudFlareInterceptor.registerInterceptor();
    this.httpError.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
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
