import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ContentRating,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionType,
    PagedResults,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SourceManga,
    type ChapterProviding,
    type DiscoverSectionProviding,
    type Extension,
    type MangaProviding,
    type SearchResultsProviding,
} from "@paperback/types";
import { APIRequests, MainInterceptor } from "./network";
import { FansubGeneralParsers } from "./parsers";

export interface FansubGenericParams {
    name: string;
    domain: string;
    contentRating: ContentRating;
}

abstract class FansubGeneral
    implements
        Extension,
        SearchResultsProviding,
        MangaProviding,
        ChapterProviding,
        DiscoverSectionProviding
{
    readonly name: string;
    public base_url = "";
    public defaultContentRating = ContentRating.EVERYONE;
    parser: FansubGeneralParsers;
    requestManager: APIRequests;
    mainRateLimiter: BasicRateLimiter;
    mainInterceptor: MainInterceptor;

    protected constructor(params: FansubGenericParams) {
        this.name = params.name;
        this.base_url = params.domain;
        this.defaultContentRating =
            params.contentRating ?? ContentRating.EVERYONE;
        this.parser = new FansubGeneralParsers();
        this.requestManager = new APIRequests(this.base_url);
        // Rate limit: Wait 1 sec after 5 requests
        this.mainRateLimiter = new BasicRateLimiter("main", {
            numberOfRequests: 1,
            bufferInterval: 1,
            ignoreImages: true,
        });
        this.mainInterceptor = new MainInterceptor("main");
    }
    getMangaDetails(mangaId: string): Promise<SourceManga> {
        return this.parser.parseMangaDetails(mangaId, this);
    }

    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
    }

    getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        return this.parser.parseChapterDetails(chapter, this);
    }

    getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return this.parser.parseChapters(sourceManga, this);
    }

    getDiscoverSectionItems(
        section: DiscoverSection,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        return this.parser.parseSectionHome(this, section);
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        const discover_section: DiscoverSection[] = [];
        discover_section.push({
            id: "section",
            title: "Tendenze",
            subtitle: "",
            type: DiscoverSectionType.chapterUpdates,
        });
        return discover_section;
    }

    getSearchFilters(): Promise<SearchFilter[]> {
        return Promise.resolve([]);
    }

    async getSearchResults(
        query: SearchQuery,
    ): Promise<PagedResults<SearchResultItem>> {
        return await this.parser.parseSearchResults(query, this);
    }
}

export default FansubGeneral;
