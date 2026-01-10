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
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SourceManga,
} from "@paperback/types";
import { Forms } from "./forms";
import { MainInterceptor, mainRateLimiter } from "./network";
import { Parser } from "./parser";
import { getLanguageFilter, type Metadata, ratingFilter, typeFilter } from "./utils";

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
    return new Forms();
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

  async getSearchFilters(): Promise<SearchFilter[]> {
    const filters: SearchFilter[] = [];
    const filterValue = (Application.getState("_type") as string[]) ?? [];
    const fullList = typeFilter.map((item) => item.id);
    const getCategoryFilter = Object.fromEntries(
      (filterValue.length > 0 ? filterValue : fullList).map((item) => [item, "included" as const]),
    ) as Record<string, "included" | "excluded">;
    filters.push({
      allowExclusion: false,
      maximum: typeFilter.length,
      type: "multiselect",
      id: "typeFilter",
      title: "Type",
      options: typeFilter,
      value: getCategoryFilter,
      allowEmptySelection: false,
    });
    filters.push({
      type: "dropdown",
      id: "language",
      title: "Language",
      options: getLanguageFilter(),
      value: "",
    });
    filters.push({
      type: "dropdown",
      id: "f_srdd",
      title: "Rating",
      options: ratingFilter,
      value: "",
    });
    filters.push({
      type: "dropdown",
      id: "expungedFilter",
      title: "Browse Expunged Galleries",
      options: [
        {
          id: "on",
          value: "Yes",
        },
        {
          id: "",
          value: "No",
        },
      ],
      value: "",
    });
    filters.push({
      type: "input",
      id: "character",
      title: "Character",
      placeholder: "",
      value: "",
    });
    filters.push({
      type: "input",
      id: "female",
      title: "Female",
      placeholder: "",
      value: "",
    });
    filters.push({
      type: "input",
      id: "male",
      title: "Male",
      placeholder: "",
      value: "",
    });
    filters.push({
      type: "input",
      id: "parody",
      title: "Series",
      placeholder: "",
      value: "",
    });
    filters.push({
      type: "input",
      id: "other",
      title: "Other",
      placeholder: "",
      value: "",
    });
    filters.push({
      type: "input",
      id: "minPagesFilter",
      title: "Minimum pages",
      placeholder: "",
      value: "",
    });
    filters.push({
      type: "input",
      id: "maxPagesFilter",
      title: "Maximum pages",
      placeholder: "",
      value: "",
    });
    return filters;
  }

  getSearchResults(
    query: SearchQuery,
    metadata: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
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
