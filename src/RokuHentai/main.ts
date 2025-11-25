import {
    BasicRateLimiter,
    type Chapter,
    type ChapterDetails,
    type ChapterProviding,
    type Extension,
    type MangaProviding,
    type PagedResults,
    type SearchFilter,
    type SearchQuery,
    type SearchResultItem,
    type SearchResultsProviding,
    type SourceManga,
} from "@paperback/types";
import { MainInterceptor } from "./network";
import { Parser } from "./parsers";
import { RokuMetadata } from "./utils";

const parser = new Parser();

type RokuHentaiImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;

export class RokuHentaiExtension implements RokuHentaiImplementation {
    mainRateLimiter = new BasicRateLimiter("main", {
        numberOfRequests: 1,
        bufferInterval: 1,
        ignoreImages: true,
    });

    mainInterceptor = new MainInterceptor("main");

    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
    }

    getMangaDetails(mangaId: string): Promise<SourceManga> {
        return parser.parseMangaDetails(mangaId);
    }

    getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        return parser.parseChapterDetails(chapter);
    }

    getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return parser.parseChapters(sourceManga);
    }

    getSearchFilters(): Promise<SearchFilter[]> {
        return Promise.resolve([]);
    }

    getSearchResults(
        query: SearchQuery,
        metadata: RokuMetadata,
    ): Promise<PagedResults<SearchResultItem>> {
        return parser.parseSearchResult(query, metadata);
    }
}

export const RokuHentai = new RokuHentaiExtension();
