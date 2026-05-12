/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

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
  type Metadata,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import { MangaDotApi } from "./api";
import { MangaDotInterceptor } from "./network";
import MangaDotConfig from "./pbconfig";
import { Parser } from "./parser";
import type { BaseMetadata, MangaDotMetadata } from "./models";
import MangaDotAdvancedSearchForm from "./searchFilters";
import { MangaDotFilters } from "./filters";

export class MangaDotExtension implements ExtensionImpl<typeof MangaDotConfig> {
  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }
  api = new MangaDotApi();
  parser = new Parser();
  filters = new MangaDotFilters();
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const mangaInfo = await this.api.getJsonMangaInfoApi(mangaId);
    return this.parser.parseMangaInfo(mangaInfo);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const chapters = await this.api.getJsonChapterListApi(sourceManga.mangaId);
    return this.parser.parseChapters(chapters, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const pages = await this.api.getJsonChapPagesApi(
      chapter.chapterId,
      chapter.sourceManga.mangaId,
    );
    return this.parser.parseChapterPages(pages, chapter);
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "latest_updates",
        title: "Latest updates",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "recently_added",
        title: "Recently Added",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "most_tracked",
        title: "Most Tracked Comics",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "top_rated",
        title: "Top Rated",
        type: DiscoverSectionType.simpleCarousel,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const sectionElements = await this.api.getJsonSectionApi(section.id);
    return this.parser.parseSection(sectionElements);
  }
  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name == "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }
  getSettingsForm(): Promise<Form> {
    throw new Error("Method not implemented.");
  }
  async getAdvancedSearchForm(searchQuery: SearchQuery<BaseMetadata>): Promise<AdvancedSearchForm> {
    // this.filters.setGenre(await this.api.getFilters());
    const filters = await this.api.getFilters();
    return new MangaDotAdvancedSearchForm(searchQuery, filters);
  }
  async getSearchResults(
    query: SearchQuery<BaseMetadata>,
    metadata: MangaDotMetadata | undefined,
    sortingOption: SortingOption | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const search = await this.api.getJsonSearchApi(query, page);
    return this.parser.parseSearch(search, metadata);
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
