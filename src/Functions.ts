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
	SourceManga
} from "@paperback/types";
import * as cheerio from "cheerio";
// Template content
import { URLBuilder } from "./helper";
import { Parser } from "./parser";
type Metadata = {
	page?: number
}
export class Functions {
	baseUrl = '';
	constructor(url: string) {
		this.baseUrl = url
	}

	parser = new Parser();
	async getDiscoverSectionItems(section: DiscoverSection,
								  metadata: unknown | undefined): Promise<PagedResults<DiscoverSectionItem>> {
		const data = (await Application.scheduleRequest({
			url: `${this.baseUrl}`,
			method: "GET",
		}))[1]
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		let type = "simpleCarouselItem"
		const mangas: [{ items: DiscoverSectionItem[] }, {
			items: DiscoverSectionItem[]
		}] = this.parser.parseInTendenzaMese($)
		switch (section.id) {
			case "mese_section":
				return mangas[0]
			case "popular_section":
				return await this.parser.parseCapitoliInTendenza($);
			case "updated_section":
				return await this.parser.parseLastAddedSetcion($)
			case "new_manga_section":
				return mangas[1]
			default:
				return {items: []}
		}
	}

	async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
		console.log(chapter);
		chapter.chapterId = chapter.chapterId.replace("_read_", "/read/");
		const data = (await Application.scheduleRequest({
			url: `${this.baseUrl}/manga/${chapter.sourceManga.mangaId}/${chapter.chapterId}/?style=list`,
			method: "GET",
		}))[1];
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
			}
		];
	}
	async getChapters(
		sourceManga: SourceManga,
		sinceDate?: Date,
	): Promise<Chapter[]> {
		console.log(sourceManga);
		console.log(sourceManga.mangaId);
		const [response, buffer] = await Application.scheduleRequest({
			url: `${this.baseUrl}/manga/${sourceManga.mangaId}`,
			method: "GET",
		});
		const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
		return this.parser.parseChapters($, sourceManga);
	}

	async getFilterList():Promise<SearchFilter[]>{
		const filters: SearchFilter[] = [];
		console.log("getSearchFilter")
		//return this.parser.parseSearchFilterGenre(this.baseUrl)
		const genres = await this.parser.parseGenresFilters(this.baseUrl)
		const types = await this.parser.parseTypeFilters(this.baseUrl)
		filters.push({
			type: "multiselect",
			options: genres,
			id: "genres",
			allowExclusion: false,
			title: "Generi",
			value: {},
			allowEmptySelection: true,
			maximum: 5
		});
		filters.push({
			type: "multiselect",
			options: types,
			id: "types",
			allowExclusion: false,
			title: "Tipo",
			value: {},
			allowEmptySelection: true,
			maximum: 1
		});
		console.log(filters)
		return filters;
	}


	async getSearchResults(
		query: SearchQuery,
		metadata: Metadata
	): Promise<PagedResults<SearchResultItem>> {
		let manga:SearchResultItem[] = []
		let page = metadata?.page ?? 1
		if (page == -1) return { items: [] }
		//let request = await this.constructSearchRequest(0,{title:"", filters:query.filters})
		if (query.title.length > 0) {
			let request = await this.constructSearchRequest(page, query)
			const $ = cheerio.load(Application.arrayBufferToUTF8String(request[1]));
			manga = (this.parser.parseSearchResults($))
		}
		else {
			let request = await this.constructSearchRequest(page, {title: "", filters: query.filters})
			const $ = cheerio.load(Application.arrayBufferToUTF8String(request[1]));
			manga = manga.concat(this.parser.parseSearchResults($))
		}
		page++
		const nextMetadata: Metadata | undefined =
			manga.length < 16 ? undefined : { page: page + 1 };
		return {items: manga, metadata: nextMetadata};
	}

	async getMangaDetails(mangaId: string): Promise<SourceManga> {
		console.log(mangaId);
		const data = (await Application.scheduleRequest({
			url: `${this.baseUrl}/manga/${mangaId}`,
			method: "GET",
		}))[1];
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		return this.parser.parseMangaDetails($, mangaId);
	}

	constructSearchRequest(page: number, query: SearchQuery={title:"", filters:[]}): any {
		const generi: string[] = [];
		const tipologia: string[] = [];
		const getFilterValue = (id: string) =>
			query.filters.find((filter) => filter.id == id)?.value;

		const genres = getFilterValue("genres");
		if (genres && typeof genres === "object") {
			for (const tag of Object.entries(genres)) {
				generi.push(tag[0])
			}
		}
		const types = getFilterValue("types");
		if (types && typeof types === "object") {
			for (const tag of Object.entries(types)) {
				tipologia.push(tag[0])
			}
		}
		const urlBuilder = new URLBuilder(this.baseUrl)
			.addPathComponent("archive")
			.addQueryParameter("keyword", encodeURIComponent(query.title ?? ""))
			.addQueryParameter("page", page.toString())
			.addQueryParameter("sort", "most_read");

		for (const genre of generi) {
			urlBuilder.addQueryParameter("genre", genre);
		}
		for (const tipo of tipologia) {
			urlBuilder.addQueryParameter("type", tipo);
		}
		return Application.scheduleRequest({
			url: urlBuilder.buildUrl({
				addTrailingSlash: true,
				includeUndefinedParameters: false,
			}),
			method: "GET",
		});
	}
}