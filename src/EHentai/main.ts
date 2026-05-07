import {
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  Form,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSectionProviding,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SourceManga,
  type AdvancedSearchForm,
} from "@paperback/types";
import EHentaiAdvancedSearchForm from "./forms/search";
import { SettingsForm } from "./forms/settings";
import { MainInterceptor, mainRateLimiter } from "./network";
import { Parser } from "./parser";
import { type Metadata, type SearchMetadata } from "./utils";

type EHentaiImplementation = SettingsFormProviding &
  DiscoverSectionProviding &
  Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding;

const parser = new Parser();
export const BASE_URL = "https://e-hentai.org";
export class EHentaiExtension implements EHentaiImplementation {
  async getSettingsForm(): Promise<Form> {
    return new SettingsForm();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const discover_section: DiscoverSection[] = [];
    discover_section.push({
      id: "Popular",
      title: "Popular",
      subtitle: "",
      type: DiscoverSectionType.prominentCarousel,
    });
    discover_section.push({
      id: "Recent",
      title: "Recent",
      subtitle: "",
      type: DiscoverSectionType.simpleCarousel,
    });
    return discover_section;
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "Popular": {
        return parser.parseFeatured();
      }
      case "Recent": {
        return parser.parseRecent();
      }
      default:
        return { items: [] };
    }
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parser.parseMangaDetail(mangaId);
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    return new EHentaiAdvancedSearchForm(searchQuery);
  }
  getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    if (query.metadata === undefined) {
      query.metadata = {
        type: (Application.getState("_type") as string[]) ?? [],
      };
    }
    return parser.parseSearchResults(query, metadata);
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return parser.parseChapters(sourceManga);
  }
  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return parser.scrapeAllChapterPages(chapter);
  }

  mainInterceptor = new MainInterceptor("main");

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }
}

export const EHentai = new EHentaiExtension();
