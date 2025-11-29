import {
    BasicRateLimiter,
    DiscoverSection,
    DiscoverSectionItem,
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
import { MainInterceptor } from "./network";
import { Parser } from "./parser";
import { languageFilter, Metadata, ratingFilter, typeFilter } from "./utils";

type EHentaiiImplementation = SettingsFormProviding &
    DiscoverSectionProviding &
    Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;

const parser = new Parser();
export class EHentaiExtension implements EHentaiiImplementation {
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
        const getCategoryFilter = Object.fromEntries(
            (Application.getState("_type") as string[]).map((item) => [
                item.toLowerCase(),
                "included" as const,
            ]),
        ) as Record<string, "included" | "excluded">;
        filters.push({
            allowEmptySelection: false,
            allowExclusion: false,
            maximum: typeFilter.length,
            type: "multiselect",
            id: "typeFilter",
            title: "Type",
            options: typeFilter,
            value: getCategoryFilter,
        });
        filters.push({
            allowEmptySelection: false,
            allowExclusion: false,
            maximum: 1,
            type: "multiselect",
            id: "languageFilter",
            title: "Language",
            options: languageFilter,
            value: {},
        });
        filters.push({
            allowEmptySelection: false,
            allowExclusion: false,
            maximum: 1,
            type: "multiselect",
            id: "ratingFilter",
            title: "Rating",
            options: ratingFilter,
            value: {},
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
}

export const EHentai = new EHentaiExtension();
