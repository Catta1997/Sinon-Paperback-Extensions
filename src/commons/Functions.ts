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
    SourceManga
} from "@paperback/types";
import * as cheerio from "cheerio";
import {CheerioAPI} from "cheerio";
// Template content
import {Metadata, URLBuilder} from "./helper";
import {Parser} from "./parser";


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
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        const read:DiscoverSectionItem[] = []
        const mangaType:DiscoverSectionItem[] = []
        const allGenres:DiscoverSectionItem[] = []
        this.getGenreFilter().forEach(filter => {
            allGenres.push(
                {
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            {id: "genres", value: filter.id}
                        ],
                    },
                    name: filter.value,
                    metadata: metadata,
                    contentRating: this.parser.getRating([filter.value])
                })
        })
        this.getOrderFilter().forEach(filter => {
            read.push(
                {
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            {id: "order", value: filter.id}
                        ],
                    },
                    name: filter.value,
                    metadata: metadata,
                    contentRating: ContentRating.EVERYONE
            })
        })

        this.getMangaTypeFilter().forEach(filter => {
            mangaType.push(
                {
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            {id: "types", value: filter.id}
                        ],
                    },
                    name: filter.value,
                    metadata: metadata,
                    contentRating: ContentRating.EVERYONE
                })
        })


        switch (section.id) {
            case "mese_section":
                console.log("mese_section loaded");
                return this.parser.parseInTendenzaMese($, metadata)
            case "popular_section":
                this.numberPage = 0;
                console.log("popular_section loaded");
                return this.parser.parseCapitoliInTendenza($, metadata);
            case "updated_section":
                console.log("updated_section loaded");
                return this.parser.parseLastAddedSetcion(metadata, this.baseUrl);
            case "new_manga_section": {
                console.log("new_manga_section loaded");
                return this.parser.parseLastMangaAddedSetcion(metadata, this.baseUrl);
            }
            case "read_section": {
                console.log("read_section loaded")
                return {
                    items: read,
                    metadata: metadata
                };
            }
            case "genre_section": {
                console.log("type_section loaded")
                return {
                    items: allGenres,
                    metadata: metadata
                };
            }
            case "type_section": {
                console.log("type_section loaded")
                return {
                    items: mangaType,
                    metadata: metadata
                };
            }
            default:
                return { items: [], metadata: metadata };
        }
    }

    getMangaTypeFilter(){
        return [
            { value: "Manga", id: "manga" },
            { value: "Manhua", id: "manhua" },
            { value: "Manhwa", id: "manhwa" },
            { value: "Oneshot", id: "oneshot" },
            { value: "Thai", id: "thai" },
            { value: "Vietnamita", id: "vietnamese" }
        ]
    }

    getOrderFilter(){
        return [
            { value: "Più Letto", id: "most_read" },
            { value: "Meno Letto", id: "less_read" },
            { value: "Alfabetico A-Z", id: "a-z" },
            { value: "Alfabetico Z-A", id: "z-a" },
            { value: "Più recente", id: "newest" },
            { value: "Meno recente", id: "oldest" }
        ]
    }

    getGenreFilter(){
        return [
            { value: "Adulti", id: "adulti" },
            { value: "Arti Marziali", id: "arti-marziali" },
            { value: "Avventura", id: "avventura" },
            { value: "Azione", id: "azione" },
            { value: "Commedia", id: "commedia" },
            { value: "Doujinshi", id: "doujinshi" },
            { value: "Drammatico", id: "drammatico" },
            { value: "Ecchi", id: "ecchi" },
            { value: "Fantasy", id: "fantasy" },
            { value: "Gender Bender", id: "gender-bender" },
            { value: "Harem", id: "harem" },
            { value: "Hentai", id: "hentai" },
            { value: "Horror", id: "horror" },
            { value: "Josei", id: "josei" },
            { value: "Lolicon", id: "lolicon" },
            { value: "Maturo", id: "maturo" },
            { value: "Mecha", id: "mecha" },
            { value: "Mistero", id: "mistero" },
            { value: "Psicologico", id: "psicologico" },
            { value: "Romantico", id: "romantico" },
            { value: "Sci-fi", id: "sci-fi" },
            { value: "Scolastico", id: "scolastico" },
            { value: "Seinen", id: "seinen" },
            { value: "Shotacon", id: "shotacon" },
            { value: "Shoujo", id: "shoujo" },
            { value: "Shoujo Ai", id: "shoujo-ai" },
            { value: "Shounen", id: "shounen" },
            { value: "Shounen Ai", id: "shounen-ai" },
            { value: "Slice of Life", id: "slice-of-life" },
            { value: "Smut", id: "smut" },
            { value: "Soprannaturale", id: "soprannaturale" },
            { value: "Sport", id: "sport" },
            { value: "Storico", id: "storico" },
            { value: "Tragico", id: "tragico" },
            { value: "Yaoi", id: "yaoi" },
            { value: "Yuri", id: "yuri" }
        ];
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
                type: DiscoverSectionType.genres
            },
            {
                id: "genre_section",
                title: "Generi",
                type: DiscoverSectionType.genres
            }
            /*,
            {
                id: "read_section",
                title: "Ordinamento",
                type: DiscoverSectionType.genres
            }
            */
        ];
    }
    async getChapters(
        sourceManga: SourceManga,
        sinceDate?: Date,
    ): Promise<Chapter[]> {
        this.sinceDate = sinceDate;
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
        console.log("getSearchFilter");
        filters.push({
            type: "dropdown",
            options: this.getOrderFilter(),
            id: "order",
            value: "most_read",
            title: "Ordine",
        });
        filters.push({
            type: "multiselect",
            options: this.getMangaTypeFilter(),
            id: "types",
            allowExclusion: false,
            title: "Tipo",
            value: {},
            allowEmptySelection: true,
            maximum: 1,
        });
        filters.push({
            type: "multiselect",
            options: this.getGenreFilter(),
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
        page++
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
        const genres: string | Record<string, "included" | "excluded"> = getFilterValue("genres") ?? "";
        const types: string | Record<string, "included" | "excluded"> = getFilterValue("types") ?? "";
        if (genres && typeof genres === "object") {
            for (const tag of Object.entries(genres)) {
                generi.push(tag[0]);
            }
        }
        else
            generi.push(genres);
        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                tipologia.push(tag[0]);
            }
        }
        else
            tipologia.push(types);

        const urlBuilder = new URLBuilder(this.baseUrl)
            .addPathComponent("archive")
            .addQueryParameter("keyword", encodeURIComponent(query.title ?? ""))
            .addQueryParameter("page", page.toString())
            .addQueryParameter("sort", getFilterValue("order"))
            .addQueryParameter("genre", generi)
            .addQueryParameter("type", tipologia);
        return urlBuilder.buildUrl();
    }
}