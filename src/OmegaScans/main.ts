import {
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  type Cookie,
  CookieStorageInterceptor,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  DiscoverSectionType,
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
import type { OmegaScansMetadata } from "./model";
import { JsonParser } from "./parser";

type OmegaScansImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  DiscoverSectionProviding &
  CloudflareBypassRequestProviding;

export class OmegaScansExtension implements OmegaScansImplementation {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "latestComic",
        title: "Latest Comic",
        type: DiscoverSectionType.featured,
      },
      {
        id: "latestNovel",
        title: "Latest Novel",
        type: DiscoverSectionType.featured,
      },
    ];
  }
  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: OmegaScansMetadata  ,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    switch (section.id) {
      case "latestComic":
        return this.parser.getSections("Comic", page, "latest", metadata);
      case "latestNovel":
        return this.parser.getSections("Novel", page, "latest", metadata);
      default:
        return { items: [], metadata: metadata };
    }
  }

  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  mainInterceptor = new MainInterceptor("main");
  parser = new JsonParser();
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

  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return this.parser.parseMangaInfo(mangaId);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    if (chapter.sourceManga.mangaInfo.contentType === "comic") {
      return this.parser.getMangaPages(chapter.sourceManga.mangaId, chapter.chapterId);
    } else {
      return { id: chapter.chapterId, mangaId: chapter.sourceManga.mangaId, pages: [] };
    }
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return this.parser.getChapterList(sourceManga);
  }

  getSearchResults(
    query: SearchQuery<{}>,
    metadata: OmegaScansMetadata,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.parser.getSearchResult(query.title, metadata);
  }
}

export const OmegaScans = new OmegaScansExtension();
