import {
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  type ExtensionImpl,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import { MainInterceptor } from "./network";
import { API, type OmegaScansMetadata, type OmegaScansSearchMetadata } from "./model";
import { JsonParser } from "./parser";
import OmegaScansAdvancedSearchForm from "./search";
import { CloudflareInterceptor, HttpErrorInterceptor } from "paperback-interceptors";
import type basePbConfig from "./pbconfig";

export class OmegaScansExtension implements ExtensionImpl<typeof basePbConfig> {
  async getAdvancedSearchForm(searchQuery: SearchQuery<OmegaScansSearchMetadata>) {
    return new OmegaScansAdvancedSearchForm(searchQuery);
  }
  async getSortingOptions(_query: SearchQuery<OmegaScansSearchMetadata>): Promise<SortingOption[]> {
    return [
      { id: "$", label: "Default" },
      { id: "latest$asc", label: "Latest ↑" },
      { id: "latest$desc", label: "Latest ↓" },
      { id: "day_views$asc", label: "Daily Views ↑" },
      { id: "day_views$desc", label: "Daily Views ↓" },
    ];
  }

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
      {
        id: "genres",
        title: "Genres",
        type: DiscoverSectionType.genres,
      },
      {
        id: "trendingDaily",
        title: "Trending Daily",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: "trendingWeekly",
        title: "Trending Weekly",
        type: DiscoverSectionType.prominentCarousel,
      },
    ];
  }
  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: OmegaScansMetadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "latestComic":
        return this.parser.getSections("Comic", "latest", metadata);
      case "latestNovel":
        return this.parser.getSections("Novel", "latest", metadata);
      case "trendingDaily":
        return this.parser.getTrendingSections("daily");
      case "trendingWeekly":
        return this.parser.getTrendingSections("weekly");
      case "genres":
        return this.parser.getGenresSections();
      default:
        return { items: [], metadata: metadata };
    }
  }

  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });
  mainInterceptor = new MainInterceptor("main");
  cloudFlareInterceptor = new CloudflareInterceptor({ url: API }, "cloudflare");
  httpErroreInterceptor = new HttpErrorInterceptor("httpError");
  parser = new JsonParser();
  async initialise(): Promise<void> {
    this.mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
    this.cloudFlareInterceptor.registerInterceptor();
    this.httpErroreInterceptor.registerInterceptor();
  }

  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return this.parser.parseMangaInfo(mangaId);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    if (chapter.sourceManga.mangaInfo.contentType === "comic") {
      return this.parser.getMangaPages(chapter.sourceManga.mangaId, chapter.chapterId);
    } else {
      return this.parser.getNovel(chapter.sourceManga.mangaId, chapter.chapterId);
    }
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return this.parser.getChapterList(sourceManga);
  }

  getSearchResults(
    query: SearchQuery<OmegaScansSearchMetadata>,
    metadata: OmegaScansMetadata,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.parser.getSearchResult(query, metadata, sortingOption);
  }
}

export const OmegaScans = new OmegaScansExtension();
