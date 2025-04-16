import {
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
} from "@paperback/types";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
// Template content
import {
    getGenreFilter,
    getMangaTypeFilter,
    getOrderFilter,
    Metadata,
    URLBuilder,
} from "./helper";
import { Parser } from "./parser";

export class Functions {
    baseUrl = "";
    rating: ContentRating = ContentRating.EVERYONE;

    constructor(url: string, contentRating: ContentRating) {
        this.baseUrl = url;
        this.rating = contentRating;
    }
    private parser = new Parser(this.rating);

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        const mangaType: DiscoverSectionItem[] = [];
        const allGenres: DiscoverSectionItem[] = [];
        getGenreFilter().forEach((filter) => {
            allGenres.push({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [{ id: "genres", value: filter.id }],
                },
                name: filter.value,
                metadata: metadata,
                contentRating: this.parser.getRating([filter.value]),
            });
        });
        getMangaTypeFilter().forEach((filter) => {
            mangaType.push({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [{ id: "types", value: filter.id }],
                },
                name: filter.value,
                metadata: metadata,
                contentRating:
                    this.rating === ContentRating.ADULT
                        ? ContentRating.ADULT
                        : undefined,
            });
        });

        switch (section.id) {
            case "popular_section":
                console.log("Loading popular_section loaded");
                return this.parser.parseCapitoliInTendenza($, metadata);
            case "mese_section":
                console.log("Loading mese_section loaded");
                return this.parser.parseInTendenzaMese($, metadata);
            case "updated_section":
                console.log("Loading updated_section loaded");
                return this.parser.parseLastAddedSetcion(
                    metadata,
                    this.baseUrl,
                );
            case "new_manga_section": {
                console.log("Loading new_manga_section loaded");
                return this.parser.parseLastMangaAddedSetcion(
                    metadata,
                    this.baseUrl,
                );
            }
            case "genre_section": {
                console.log("Loading type_section loaded");
                return {
                    items: allGenres,
                    metadata: metadata,
                };
            }
            case "type_section": {
                console.log("Loading type_section loaded");
                return {
                    items: mangaType,
                    metadata: metadata,
                };
            }
            default:
                return { items: [], metadata: metadata };
        }
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${chapter.sourceManga.mangaId}/read/${chapter.chapterId}/?style=list`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        return this.parser.parseChapterDetails(
            $,
            chapter.sourceManga.mangaId,
            chapter.chapterId,
        );
    }
    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "popular_section",
                title: "Capitoli In Tendenza",
                type: DiscoverSectionType.featured,
            },
            {
                id: "mese_section",
                title: "Manga del Mese",
                subtitle: "Manga più letti del mese",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "updated_section",
                title: "Aggiornati di Recente",
                subtitle: "Ultimi Capitoli Aggiunti",
                type: DiscoverSectionType.chapterUpdates,
            },
            {
                id: "new_manga_section",
                title: "Nuove Aggiunte",
                subtitle: "Nuovi Manga",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "type_section",
                title: "Tipo",
                subtitle: "Manga più letti di un tipo",
                type: DiscoverSectionType.genres,
            },
            {
                id: "genre_section",
                title: "Generi",
                subtitle: "Manga più letti di un genere",
                type: DiscoverSectionType.genres,
            },
        ];
    }
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        console.log("Get Chapters of MangaID " + sourceManga.mangaId);
        const [_, buffer] = await Application.scheduleRequest({
            url: `${this.baseUrl}/manga/${sourceManga.mangaId}`,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return this.parser.parseChapters($, sourceManga);
    }

    async getFilterList(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];
        filters.push({
            type: "dropdown",
            options: getOrderFilter(),
            id: "order",
            value: ((Application.getState("def_order") as string[]) ?? [
                "most_read",
            ])[0],
            title: "Ordine",
        });
        const def_value = ((Application.getState("def_type") as string[]) ??
            [])[0];
        filters.push({
            type: "multiselect",
            options: getMangaTypeFilter(),
            id: "types",
            allowExclusion: false,
            title: "Tipo",
            value: def_value ? { [def_value]: "included" } : {},
            allowEmptySelection: true,
            maximum: 1,
        });
        filters.push({
            type: "multiselect",
            options: getGenreFilter(),
            id: "genres",
            allowExclusion: false,
            title: "Generi",
            value: {},
            allowEmptySelection: true,
            maximum: 5,
        });
        return filters;
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
    ): Promise<PagedResults<SearchResultItem>> {
        let manga: SearchResultItem[] = [];
        let page = metadata?.page ?? 1;
        if (page == -1) return { items: [] };
        const url = this.constructSearchRequestURL(page, query);
        const data = (
            await Application.scheduleRequest({
                url: `${url}`,
                method: "GET",
            })
        )[1];
        const $: CheerioAPI = cheerio.load(
            Application.arrayBufferToUTF8String(data),
        );
        manga = this.parser.parseSearchResults($);
        page++;
        return { items: manga, metadata: { page: page } };
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        console.log("Get Details of MangaID " + mangaId);
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${mangaId}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        return this.parser.parseMangaDetails(
            $,
            mangaId,
            `${this.baseUrl}/manga/${mangaId}`,
        );
    }

    constructSearchRequestURL(
        page: number,
        query: SearchQuery = { title: "", filters: [] },
    ): string {
        const generi: string[] = [];
        const tipologia: string[] = [];
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        const genres: string | Record<string, "included" | "excluded"> =
            getFilterValue("genres") ?? "";
        const types: string | Record<string, "included" | "excluded"> =
            getFilterValue("types") ?? "";
        if (genres && typeof genres === "object") {
            for (const tag of Object.entries(genres)) {
                if (tag[0].length > 0) generi.push(tag[0]);
            }
        } else if (genres.length > 0) generi.push(genres);

        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                if (tag[0].length > 0) tipologia.push(tag[0]);
            }
        } else if (types.length > 0) tipologia.push(types);

        console.log("Search query: " + query.title);
        const urlBuilder = new URLBuilder(this.baseUrl).addPathComponent(
            "archive",
        );
        if (query.title.toString().length > 0)
            urlBuilder.addQueryParameter(
                "keyword",
                query.title.toString() ?? "",
            );
        if (page.toString().length > 0)
            urlBuilder.addQueryParameter("page", page.toString());
        if (getFilterValue("order"))
            urlBuilder.addQueryParameter("sort", getFilterValue("order"));
        if (generi.length > 0) urlBuilder.addQueryParameter("genre", generi);
        if (tipologia.length > 0)
            urlBuilder.addQueryParameter("type", tipologia);
        return urlBuilder.buildUrl();
    }
}
