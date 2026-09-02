import {
  type DiscoverSection,
  type DiscoverSectionItem,
  Form,
  type Request,
  type Response,
  type Chapter,
  type ChapterDetails,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type AdvancedSearchForm,
  type ExtensionImpl,
  type ManagedCollection,
  type ManagedCollectionChangeset,
} from "@paperback/types";
import EHentaiAdvancedSearchForm from "./forms/search";
import { SettingsForm } from "./forms/settings";
import {
  MainInterceptor,
  mainRateLimiter,
  Network,
  ImageURLInterceptor,
  LogInManager,
} from "./network";
import { Parser } from "./parser";
import { getDebugMode, getDefaultMetadata, type Metadata, type SearchMetadata } from "./utils";
import { basePbConfig } from "./config";
import { SectionsOrder } from "paperback-sections";
import { discoverSection } from "./models";

export let BASE_URL = "";
export let REQUIRE_LOGIN = false;
export const network = new Network();
export const parser = new Parser();
export const loginManager = new LogInManager();
export const sections = new SectionsOrder(discoverSection);

export class EHentaiGeneralExtension implements ExtensionImpl<typeof basePbConfig> {
  async getSettingsForm(): Promise<Form> {
    return new SettingsForm(await Application.getDefaultUserAgent());
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return sections.getFilteredSections();
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    if (getDebugMode()) {
      console.log(`getDiscoverSectionItems s:${JSON.stringify(metadata)}`);
      console.log(`getDiscoverSectionItems m:${JSON.stringify(section)}`);
    }
    switch (section.id) {
      case "Featured": {
        return parser.parseFeatured(metadata);
      }
      case "Popular": {
        return parser.parseRecent(metadata);
      }
      case "Watched": {
        if (!loginManager.isLoggedIn()) {
          throw new Error("This Section is only available with Log-In");
        }
        return parser.parseWatched(metadata);
      }
      case "Favorite": {
        if (!loginManager.isLoggedIn()) {
          throw new Error("This Section is only available with Log-In");
        }
        return parser.parseFavorite();
      }
      default:
        return { items: [] };
    }
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    if (getDebugMode()) {
      console.log(`getMangaDetails for ${mangaId}`);
    }
    return parser.parseMangaDetail(mangaId);
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    if (getDebugMode()) {
      console.log(`getAdvancedSF for ${JSON.stringify(searchQuery)}`);
    }
    return new EHentaiAdvancedSearchForm(searchQuery);
  }

  getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    if (query.metadata === undefined) {
      query.metadata = getDefaultMetadata();
    }
    if (getDebugMode()) {
      console.log(`getSearchResults m:${JSON.stringify(metadata)}`);
      console.log(`getSearchResults q:${JSON.stringify(query)}`);
    }
    return parser.parseSearchResults(query, metadata);
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    if (getDebugMode()) {
      console.log(`getChapters for ${JSON.stringify(sourceManga)}`);
    }
    return parser.parseChapters(sourceManga);
  }

  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    if (getDebugMode()) {
      console.log(`getChapterDetails for ${JSON.stringify(chapter)}`);
    }
    return parser.scrapeAllChapterPages(chapter);
  }

  mainInterceptor = new MainInterceptor("main");
  imageInterceptor = new ImageURLInterceptor("image");

  protected constructor(domain: string, requireLogIn: boolean) {
    BASE_URL = domain;
    REQUIRE_LOGIN = requireLogIn;
  }

  async getManagedLibraryCollections(): Promise<ManagedCollection[]> {
    const favorites = await network.getFevList();
    return favorites.map((fav) => ({ id: fav.id, title: fav.value }));
  }

  async commitManagedCollectionChanges(changeset: ManagedCollectionChangeset): Promise<void> {
    for (const manga of changeset.additions) {
      await network.addToFavorite(manga.mangaId, changeset.collection.id);
    }
    for (const manga of changeset.deletions) {
      await network.deleteFromFavorite(manga.mangaId);
    }
  }

  getSourceMangaInManagedCollection(managedCollection: ManagedCollection): Promise<SourceManga[]> {
    return parser.parseFavoriteList(managedCollection.id);
  }
  async redirectHandler(proposedRequest: Request, _response: Response) {
    if (getDebugMode()) {
      console.log(`redirectHandler called for ${JSON.stringify(proposedRequest)}`);
    }
    if (/exhentai\.org\/\?poni=/.test(proposedRequest.url)) return undefined;
    return proposedRequest;
  }

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    loginManager.loginCookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
    this.imageInterceptor.registerInterceptor();
    Application.setRedirectHandler(
      Application.Selector(this as EHentaiGeneralExtension, "redirectHandler"),
    );
  }
}
