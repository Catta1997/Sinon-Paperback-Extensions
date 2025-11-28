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
    type SortingOption,
    type SourceManga,
} from "@paperback/types";
import type { Metadata } from "./models";
import { MainInterceptor } from "./network";
import { globalFilters, JsonParser } from "./parsers";

const parse = new JsonParser();
export const filter = new globalFilters();
type HentaiHandImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;

export class HentaiHandExtension implements HentaiHandImplementation {
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

    async getSearchFilters(): Promise<SearchFilter[]> {
        return filter.getFilters();
    }

    getSearchResults(
        query: SearchQuery,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        return parse.parseSearchResults(query, metadata);
    }
    async getSortingOptions(): Promise<SortingOption[]> {
        return [];
    }

    getMangaDetails(mangaId: string): Promise<SourceManga> {
        return parse.parseMangaDetails(mangaId);
    }

    getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return parse.parseChapters(sourceManga);
    }
    getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        return parse.parseChapterDetails(chapter.chapterId);
    }
}

export const HentaiHand = new HentaiHandExtension();
