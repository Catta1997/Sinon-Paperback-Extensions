import {
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  CookieStorageInterceptor,
  type Request,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type ExtensionImpl,
} from "@paperback/types";
import { MainInterceptor } from "./network";
import { Parser } from "./parsers";
import { type RokuMetadata } from "./utils";
import { CloudflareInterceptor, HttpErrorInterceptor } from "paperback-interceptors";
import type basePbConfig from "./pbconfig";

export const DOMAIN = "https://rokuhentai.com/";
const parser = new Parser();

export class RokuHentaiExtension implements ExtensionImpl<typeof basePbConfig> {
  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  mainInterceptor = new MainInterceptor("main");
  cloudflareInterceptor = new CloudflareInterceptor({ url: DOMAIN }, "cloudflare");
  httpErrorInterceptor = new HttpErrorInterceptor("httpError");

  async initialise(): Promise<void> {
    this.mainRateLimiter.registerInterceptor();
    this.cloudflareInterceptor.registerInterceptor();
    this.httpErrorInterceptor.registerInterceptor();
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

  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parser.parseMangaDetails(mangaId);
  }

  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return parser.parseChapterDetails(chapter);
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return parser.parseChapters(sourceManga);
  }

  getSearchResults(
    query: SearchQuery<{}>,
    metadata: RokuMetadata,
  ): Promise<PagedResults<SearchResultItem>> {
    return parser.parseSearchResult(query, metadata);
  }
}

export const RokuHentai = new RokuHentaiExtension();
