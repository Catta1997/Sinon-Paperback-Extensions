import {
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
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
  type Cookie,
  type ExtensionImpl,
  type ManagedCollection,
  type ManagedCollectionChangeset,
} from "@paperback/types";
import EHentaiAdvancedSearchForm from "./forms/search";
import { SettingsForm } from "./forms/settings";
import { MainInterceptor, mainRateLimiter, Network, ImageURLInterceptor } from "./network";
import { Parser } from "./parser";
import { getDefaultMetadata, LogInManager, type Metadata, type SearchMetadata } from "./utils";
import { basePbConfig } from "./config";
import { CloudflareInterceptor } from "paperback-interceptors";

export let BASE_URL = "";
export let REQUIRE_LOGIN = false;
export const network = new Network();
export const parser = new Parser();
export const loginManager = new LogInManager();
export class EHentaiGeneralExtension implements ExtensionImpl<typeof basePbConfig> {
  async getSettingsForm(): Promise<Form> {
    return new SettingsForm(await Application.getDefaultUserAgent());
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const discover_section: DiscoverSection[] = [];
    discover_section.push({
      id: "Featured",
      title: "Featured",
      subtitle: "",
      type: DiscoverSectionType.featured,
    });
    discover_section.push({
      id: "Popular",
      title: "Popular",
      subtitle: "",
      type: DiscoverSectionType.featured,
    });
    if (loginManager.isLoggedIn()) {
      discover_section.push({
        id: "Watched",
        title: "Watched",
        subtitle: "",
        type: DiscoverSectionType.featured,
      });
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
    metadata: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "Featured": {
        return parser.parseFeatured(metadata);
      }
      case "Popular": {
        return parser.parseRecent(metadata);
      }
      case "Watched": {
        return parser.parseWatched(metadata);
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
    await loginManager.logIn(cookies);
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
  cloudflareInterceptor = new CloudflareInterceptor(
    { url: `https://forums.e-hentai.org/` },
    "cloudflare",
  );

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
    if (/exhentai\.org\/\?poni=/.test(proposedRequest.url)) return undefined;
    return proposedRequest;
  }

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    loginManager.loginCookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
    this.imageInterceptor.registerInterceptor();
    this.cloudflareInterceptor.registerInterceptor();
    Application.setRedirectHandler(
      Application.Selector(this as EHentaiGeneralExtension, "redirectHandler"),
    );
  }
}
