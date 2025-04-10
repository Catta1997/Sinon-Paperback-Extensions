import {
    Chapter,
    ChapterDetails,
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
    constructor(url: string) {
        this.baseUrl = url;
    }
    private parser = new Parser();
    numberPage: number = 0;
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
        const read: DiscoverSectionItem[] = [];
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
        getOrderFilter().forEach((filter) => {
            read.push({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [{ id: "order", value: filter.id }],
                },
                name: filter.value,
                metadata: metadata,
                contentRating: undefined,
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
                contentRating: undefined,
            });
        });

        switch (section.id) {
            case "mese_section":
                console.log("mese_section loaded");
                return this.parser.parseInTendenzaMese($, metadata);
            case "popular_section":
                this.numberPage = 0;
                console.log("popular_section loaded");
                return this.parser.parseCapitoliInTendenza($, metadata);
            case "updated_section":
                console.log("updated_section loaded");
                return this.parser.parseLastAddedSetcion(
                    metadata,
                    this.baseUrl,
                );
            case "new_manga_section": {
                console.log("new_manga_section loaded");
                return this.parser.parseLastMangaAddedSetcion(
                    metadata,
                    this.baseUrl,
                );
            }
            case "read_section": {
                console.log("read_section loaded");
                return {
                    items: read,
                    metadata: metadata,
                };
            }
            case "genre_section": {
                console.log("type_section loaded");
                return {
                    items: allGenres,
                    metadata: metadata,
                };
            }
            case "type_section": {
                console.log("type_section loaded");
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
                id: "mese_section",
                title: "Manga del Mese",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "popular_section",
                title: "Capitoli In Tendenza",
                type: DiscoverSectionType.featured,
            },
            {
                id: "updated_section",
                title: "Aggiornati di Recente",
                type: DiscoverSectionType.chapterUpdates,
            },
            {
                id: "new_manga_section",
                title: "Nuove Aggiunte",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "type_section",
                title: "Tipo",
                type: DiscoverSectionType.genres,
            },
            {
                id: "genre_section",
                title: "Generi",
                type: DiscoverSectionType.genres,
            },
        ];
    }
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        console.log("MangaID " + sourceManga.mangaId);
        const [_, buffer] = await Application.scheduleRequest({
            url: `${this.baseUrl}/manga/${sourceManga.mangaId}`,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return this.parser.parseChapters($, sourceManga);
    }

    async getFilterList(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];
        console.log("Filter List");
        filters.push({
            type: "dropdown",
            options: getOrderFilter(),
            id: "order",
            value: ((Application.getState("def_order") as string[]) ?? [
                "most_read",
            ])[0],
            title: "Ordine",
        });
        filters.push({
            type: "multiselect",
            options: getMangaTypeFilter(),
            id: "types",
            allowExclusion: false,
            title: "Tipo",
            value: {},
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
        console.log("MangaID " + mangaId);
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${mangaId}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        return this.parser.parseMangaDetails($, mangaId);
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
                generi.push(tag[0]);
            }
        } else generi.push(genres);
        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                tipologia.push(tag[0]);
            }
        } else tipologia.push(types);
        console.log(query.title);
        const urlBuilder = new URLBuilder(this.baseUrl)
            .addPathComponent("archive")
            .addQueryParameter("keyword", query.title.toString() ?? "")
            .addQueryParameter("page", page.toString())
            .addQueryParameter("sort", getFilterValue("order"))
            .addQueryParameter("genre", generi)
            .addQueryParameter("type", tipologia);
        return urlBuilder.buildUrl();
    }
}
