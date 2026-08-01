import {
  type Chapter,
  type ChapterDetails,
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  type ExtensionImpl,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";

import { Parser } from "./parser";
import type { Metadata, SearchMetadata } from "./models";
import { CloudflareInterceptor, HttpErrorInterceptor } from "paperback-interceptors";
import { MainInterceptor } from "./network";
import type basePbConfig from "./pbconfig";

const parser = new Parser();

export const BASE_URL = "https://novelsonline.org";

export class NovelsOnlineExtension implements ExtensionImpl<typeof basePbConfig> {
  mainInterceptor = new MainInterceptor("main");
  httpInterceptor = new HttpErrorInterceptor("http");
  cloudflareInterceptor = new CloudflareInterceptor({ url: BASE_URL }, "cloudflare");
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "popular",
        title: "Popular Novels",
        subtitle: "",
        type: DiscoverSectionType.prominentCarousel,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular":
        return parser.parsePopular(metadata);
      default:
        return { items: [] };
    }
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parser.parseMangaDetails(mangaId);
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata?: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    return parser.parseSearch(query, metadata);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return parser.parseChapters(sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return parser.parseChapter(chapter);
  }

  async initialise(): Promise<void> {
    this.mainInterceptor.registerInterceptor();
    this.cloudflareInterceptor.registerInterceptor();
    this.httpInterceptor.registerInterceptor();
  }
}

export const NovelsOnline = new NovelsOnlineExtension();
