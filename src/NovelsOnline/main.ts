import {
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  DiscoverSectionType,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SourceManga,
} from "@paperback/types";

import { Parser } from "./parser";
import type { Metadata, SearchMetadata } from "./models";

type NovelsOnlineImplementation = Extension &
  DiscoverSectionProviding &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding;

const parser = new Parser();

export const BASE_URL = "https://novelsonline.org";

export class NovelsOnlineExtension implements NovelsOnlineImplementation {
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

  async initialise(): Promise<void> {}
}

export const NovelsOnline = new NovelsOnlineExtension();
