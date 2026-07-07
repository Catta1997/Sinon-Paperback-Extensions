import {
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  Form,
  type Request,
  type Chapter,
  type ChapterDetails,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type AdvancedSearchForm,
  type Cookie,
  type ExtensionImpl,
  CookieStorageInterceptor,
  type ManagedCollection,
  type ManagedCollectionChangeset,
  type SortingOption,
  type UpdateManager,
  type ChapterReadActionQueueProcessingResult,
  type MangaProgress,
  type TrackedMangaChapterReadAction,
} from "@paperback/types";
import EHentaiAdvancedSearchForm from "./forms/search";
import { SettingsForm } from "./forms/settings";
import { MainInterceptor, mainRateLimiter, Requests } from "./network";
import { Parser } from "./parser";
import { getAccountID, getDefaultMetadata, type Metadata, type SearchMetadata } from "./utils";
import { basePbConfig } from "./config";
import { FavoriteForm } from "./forms/favorite";

const parser = new Parser();
const network = new Requests();
export let BASE_URL = "";

export class EHentaiGeneralExtension implements ExtensionImpl<typeof basePbConfig> {
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
    if (getAccountID().length > 0) {
      discover_section.push({
        id: "Favorite",
        title: "Favorite",
        subtitle: "",
        type: DiscoverSectionType.genres,
      });
    }
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
      case "Favorite": {
        return parser.parseFavorite();
      }
      default:
        return { items: [] };
    }
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parser.parseMangaDetail(mangaId);
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ) {
    cookies.forEach((cookie) => {
      if (cookie.name == "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
      if (cookie.name == "ipb_member_id") {
        Application.setSecureState(cookie.value, "ipb_member_id");
      }
      if (cookie.name == "ipb_pass_hash") {
        Application.setSecureState(cookie.value, "ipb_pass_hash");
      }
    });
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
      query.metadata = getDefaultMetadata();
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
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  protected constructor(domain: string) {
    BASE_URL = domain;
  }

  async getMangaProgressManagementForm(sourceManga: SourceManga): Promise<Form> {
    const faves = await network.getFevList();
    const selected = await network.getFavoriteSelected(sourceManga.mangaId);
    console.log(JSON.stringify(selected, null, 2));
    return new FavoriteForm(faves, selected, sourceManga.mangaId);
  }
  async getMangaProgress(sourceManga: SourceManga): Promise<MangaProgress | undefined> {
    const selected = await network.getFavoriteSelected(sourceManga.mangaId);
    throw new Error(selected.value);
  }
  processChapterReadActionQueue(
    actions: TrackedMangaChapterReadAction[],
  ): Promise<ChapterReadActionQueueProcessingResult> {
    throw new Error("Method not implemented.");
  }

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
  }
}
