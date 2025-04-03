import { Chapter, ChapterDetails, DiscoverSection, DiscoverSectionItem, DiscoverSectionType, PagedResults, SearchQuery, SearchResultItem, SourceManga } from "@paperback/types";
import * as cheerio from "cheerio";
// Template content
import { URLBuilder } from "./helper";
import { Parser } from "./parser";

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
	async getSearchResults(
		query: SearchQuery,
		metadata: any,
	): Promise<PagedResults<SearchResultItem>> {
		let page = metadata?.page ?? 1
		if (page == -1) return { items: [] }
		if (!query.title) return { items: [] }
		const request = await this.constructSearchRequest(0, query)
		const $ = cheerio.load(Application.arrayBufferToUTF8String(request[1]));
		let manga = this.parser.parseSearchResults($)
		page++
		if (manga.length < 16) page = -1;
		return {items: manga, metadata};
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
	constructSearchRequest(page: number, query: SearchQuery): any {
		return Application.scheduleRequest({
			url: new URLBuilder(this.baseUrl)
				.addPathComponent("archive")
				.addQueryParameter("keyword", encodeURIComponent(query.title ?? ""))
				.addQueryParameter("sort", "most_read")
				.addQueryParameter("page", page.toString())
				.buildUrl({
					addTrailingSlash: true,
					includeUndefinedParameters: false,
				}),
			method: "GET",
		})
	}
}