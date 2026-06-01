import {
  type AdvancedSearchForm,
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  CookieStorageInterceptor,
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  type ExtensionImpl,
  Form,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { MangaDotApi } from "./api";
import MangaDotAdvancedSearchForm from "./forms/search";
import { SettingsForm } from "./forms/settings";
import { type ChapterPagesAPI, DOMAIN } from "./models";
import { MangaDotInterceptor } from "./network";
import { Parser } from "./parser";
import MangaDotConfig from "./pbconfig";
import { type BaseMetadata, type MangaDotMetadata, defaultMetadata, checkFilters } from "./utils";

export class MangaDotExtension implements ExtensionImpl<typeof MangaDotConfig> {
  async getSettingsForm(): Promise<Form> {
    await checkFilters(this.api);
    return new SettingsForm(this.api);
  }
  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }
  api = new MangaDotApi();
  parser = new Parser();
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const mangaInfo = await this.api.getJsonMangaInfoApi(mangaId);
    const volumes = (await this.api.getJsonVolumesApi(mangaId)).map(
      (volume) => `${DOMAIN}${volume.cover_url}`,
    );
    return this.parser.parseMangaInfo(mangaInfo, volumes);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const chapters = await this.api.getJsonChapterListApi(sourceManga.mangaId);
    return this.parser.parseChapters(chapters, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    let pages: ChapterPagesAPI = await this.api.getJsonChapPagesApi(
      chapter.chapterId,
      chapter.sourceManga.mangaId,
      chapter.additionalInfo?.upload,
    );
    return this.parser.parseChapterPages(pages, chapter);
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "top_rated",
        title: "Top Rated",
        type: DiscoverSectionType.featured,
      },
      {
        id: "recently_added",
        title: "Recently Added",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: "latest_updates",
        title: "Latest updates",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: "most_tracked",
        title: "Most Tracked Comics",
        type: DiscoverSectionType.simpleCarousel,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: MangaDotMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const sectionElements = await this.api.getJsonSectionApi(section.id, page);
    switch (section.id) {
      case "latest_updates": {
        return this.parser.parseLatestSection(sectionElements, page);
      }
      case "most_tracked": {
        return this.parser.parseSection(sectionElements, page);
      }
      case "recently_added": {
        return this.parser.parseProminentSection(sectionElements, page);
      }
      case "top_rated": {
        return this.parser.parseFeaturedSection(sectionElements, page);
      }
      default: {
        return this.parser.parseSection(sectionElements, page);
      }
    }
  }
  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name == "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }
  async getAdvancedSearchForm(searchQuery: SearchQuery<BaseMetadata>): Promise<AdvancedSearchForm> {
    await checkFilters(this.api);
    return new MangaDotAdvancedSearchForm(searchQuery);
  }
  async getSearchResults(
    query: SearchQuery<BaseMetadata>,
    metadata: MangaDotMetadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    if (query.metadata === undefined) {
      query.metadata = defaultMetadata();
    }
    const search = await this.api.getJsonSearchApi(query, page, sortingOption);
    return this.parser.parseSearch(search, metadata);
  }
  async getSortingOptions(_query: SearchQuery<BaseMetadata>): Promise<SortingOption[]> {
    return [
      { id: "relevance", label: "Relevance" },
      { id: "latest$asc", label: "Latest ↑" },
      { id: "latest$desc", label: "Latest ↓" },
      { id: "alphabetical$asc", label: "A-Z" },
      { id: "alphabetical$desc", label: "Z-A" },
      { id: "chapters$asc", label: "Chapters ↑" },
      { id: "chapters$desc", label: "Chapters ↓" },
      { id: "views$asc", label: "Most Viewed ↑" },
      { id: "views$desc", label: "Most Viewed ↓" },
      { id: "tracked$asc", label: "Most tracked ↑" },
      { id: "tracked$desc", label: "Most tracked ↓" },
      { id: "rating$asc", label: "Top Rated ↑" },
      { id: "rating$desc", label: "Top Rated ↓" },
    ];
  }
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainInterceptor = new MangaDotInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
}

export const MangaDot = new MangaDotExtension();
