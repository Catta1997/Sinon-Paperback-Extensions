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
} from "@paperback/types";
import EHentaiAdvancedSearchForm from "./forms/search";
import { SettingsForm } from "./forms/settings";
import { MainInterceptor, mainRateLimiter, Network, ImageURLInterceptor } from "./network";
import { Parser } from "./parser";
import {
  getAccountID,
  getDefaultMetadata,
  isLoggedIn,
  type Metadata,
  type SearchMetadata,
} from "./utils";
import { basePbConfig } from "./config";
import { addToFavorite, deleteFromFavorite } from "./collections";

const parser = new Parser();
const network = new Network();
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
  imageInterceptor = new ImageURLInterceptor("image");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  protected constructor(domain: string) {
    BASE_URL = domain;
  }

  async getManagedLibraryCollections(): Promise<ManagedCollection[]> {
    if (!isLoggedIn()) {
      throw new Error("You need to be logged in");
    }
    const favorites = await network.getFevList();
    return favorites.map((fav) => ({ id: fav.id, title: fav.value }));
  }

  async commitManagedCollectionChanges(changeset: ManagedCollectionChangeset): Promise<void> {
    if (!isLoggedIn()) {
      throw new Error("You need to be logged in");
    }
    for (const manga of changeset.additions) {
      await addToFavorite(manga.mangaId, changeset.collection.id);
    }
    for (const manga of changeset.deletions) {
      await deleteFromFavorite(manga.mangaId);
    }
  }

  getSourceMangaInManagedCollection(managedCollection: ManagedCollection): Promise<SourceManga[]> {
    if (!isLoggedIn()) {
      throw new Error("You need to be logged in");
    }
    return parser.parseFavoriteList(managedCollection.id);
  }

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
    this.imageInterceptor.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
  }
}
