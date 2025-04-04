import { Chapter, ChapterDetails, DiscoverSection, DiscoverSectionItem, DiscoverSectionType, PagedResults, SearchFilter, SearchQuery, SearchResultItem, SourceManga } from "@paperback/types";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
// Template content
import { Metadata, URLBuilder } from "./helper";
import { Parser } from "./parser";


export class Functions {
    baseUrl = "";
    private sinceDate: Date | undefined;
    constructor(url: string) {
        this.baseUrl = url;
    }
    parser = new Parser();
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
        console.log("getDiscoverSectionItems");
        console.log("getDiscoverSectionItems");
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        const mangas: [
            { items: DiscoverSectionItem[] },
            {
                items: DiscoverSectionItem[];
            },
        ] = this.parser.parseInTendenzaMese($, metadata);
        switch (section.id) {
            case "mese_section":
                console.log("mese_section");
                return mangas[0];
            case "popular_section":
                this.numberPage = 0;
                console.log("popular_section");
                return this.parser.parseCapitoliInTendenza($, metadata);
            case "updated_section":
                console.log("updated_section");
                return this.parser.parseLastAddedSetcion(metadata);
            case "new_manga_section": {
                console.log("new_manga_section");
                return this.parser.parseLastAddedSetcion2(metadata);
            }
            default:
                return { items: [], metadata: metadata };
        }
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        console.log(chapter);
        chapter.chapterId = chapter.chapterId.replace("_read_", "/read/");
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${chapter.sourceManga.mangaId}/${chapter.chapterId}/?style=list`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        chapter.chapterId = chapter.chapterId.replace("/read/", "_read_");
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
        ];
    }
    async getChapters(
        sourceManga: SourceManga,
        sinceDate?: Date,
    ): Promise<Chapter[]> {
        this.sinceDate = sinceDate;
        console.log(sourceManga);
        console.log(sourceManga.mangaId);
        const [_, buffer] = await Application.scheduleRequest({
            url: `${this.baseUrl}/manga/${sourceManga.mangaId}`,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return this.parser.parseChapters($, sourceManga);
    }

    async getFilterList(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];
        console.log("getSearchFilter");
        //return this.parser.parseSearchFilterGenre(this.baseUrl)
        const genres = await this.parser.parseGenresFilters(this.baseUrl);
        const types = await this.parser.parseTypeFilters(this.baseUrl);
        filters.push({
            type: "dropdown",
            options: [
                { value: "Più Letto", id: "most_read" },
                { value: "Meno Letto", id: "less_read" },
                { value: "Alfabetico A-Z", id: "a-z" },
                { value: "Alfabetico Z-A", id: "z-a" },
                { value: "Più recente", id: "newest" },
                { value: "Meno recente", id: "oldest" },
            ],
            id: "order",
            value: "most_read",
            title: "Ordine",
        });
        filters.push({
            type: "multiselect",
            options: types,
            id: "types",
            allowExclusion: false,
            title: "Tipo",
            value: {},
            allowEmptySelection: true,
            maximum: 1,
        });
        filters.push({
            type: "multiselect",
            options: genres,
            id: "genres",
            allowExclusion: false,
            title: "Generi",
            value: {},
            allowEmptySelection: true,
            maximum: 5,
        });
        console.log(filters);
        return filters;
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
    ): Promise<PagedResults<SearchResultItem>> {
        let manga: SearchResultItem[] = [];
        let page = metadata?.page ?? 1;
        if (page == -1) return { items: [] };
        //let request = await this.constructSearchRequest(0,{title:"", filters:query.filters})
        if (query.title.length > 0) {
            const url = this.constructSearchRequest(page, query);
            const data = (
                await Application.scheduleRequest({
                    url: `${url}`,
                    method: "GET",
                })
            )[1];
            //const request :ArrayBuffer = (this.constructSearchRequest(page, {title: "", filters: query.filters}))
            const $: CheerioAPI = cheerio.load(
                Application.arrayBufferToUTF8String(data),
            );
            manga = this.parser.parseSearchResults($);
        } else {
            const url = this.constructSearchRequest(page, {
                title: "",
                filters: query.filters,
            });
            const data = (
                await Application.scheduleRequest({
                    url: `${url}`,
                    method: "GET",
                })
            )[1];
            //const request :ArrayBuffer = (this.constructSearchRequest(page, {title: "", filters: query.filters}))
            const $: CheerioAPI = cheerio.load(
                Application.arrayBufferToUTF8String(data),
            );
            manga = this.parser.parseSearchResults($);
        }
        page++;
        const nextMetadata: Metadata | undefined =
            manga.length < 16 ? undefined : { page: page + 1 };
        return { items: manga, metadata: nextMetadata };
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        console.log(mangaId);
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${mangaId}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        return this.parser.parseMangaDetails($, mangaId);
    }

    constructSearchRequest(
        page: number,
        query: SearchQuery = { title: "", filters: [] },
    ): string {
        const generi: string[] = [];
        const tipologia: string[] = [];
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;

        const genres = getFilterValue("genres");
        if (genres && typeof genres === "object") {
            for (const tag of Object.entries(genres)) {
                generi.push(tag[0]);
            }
        }
        const types = getFilterValue("types");
        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                tipologia.push(tag[0]);
            }
        }

        const urlBuilder = new URLBuilder(this.baseUrl)
            .addPathComponent("archive")
            .addQueryParameter("keyword", encodeURIComponent(query.title ?? ""))
            .addQueryParameter("page", page.toString())
            .addQueryParameter("sort", getFilterValue("order"));

        for (const genre of generi) {
            urlBuilder.addQueryParameter("genre", genre);
        }
        for (const tipo of tipologia) {
            urlBuilder.addQueryParameter("type", tipo);
        }
        return urlBuilder.buildUrl();
    }
}