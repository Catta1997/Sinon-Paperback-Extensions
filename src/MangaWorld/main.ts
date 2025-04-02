import {parser} from "typescript-eslint";

// TODO:
// - Add the English name to the title view
// - Add additional info to the title view
// - Make getChapterDetails only return new chapters
// - Fix exclude search

import { BasicRateLimiter, Chapter, ChapterDetails, ChapterProviding, DiscoverSection, DiscoverSectionItem, DiscoverSectionProviding, DiscoverSectionType, Extension, Form, MangaProviding, PagedResults, PaperbackInterceptor, Request, Response, SearchFilter, SearchQuery, SearchResultItem, SearchResultsProviding, SettingsFormProviding, SourceManga } from "@paperback/types";
import * as cheerio from "cheerio";
// Template content
import { URLBuilder } from "./helper";
import { Parser } from "./parser";
// Extension settings file
import { SettingsForm } from "./SettingsForm";

const MW_DOMAIN = "https://www.mangaworld.nz";
// Should match the capabilities which you defined in pbconfig.ts
type ContentTemplateImplementation = SettingsFormProviding &
	Extension &
	DiscoverSectionProviding &
	SearchResultsProviding &
	MangaProviding &
	ChapterProviding;
// Intercepts all the requests and responses and allows you to make changes to them
class MainInterceptor extends PaperbackInterceptor {
	override async interceptRequest(request: Request): Promise<Request> {
		return request;
	}

	override async interceptResponse(
		request: Request,
		response: Response,
		data: ArrayBuffer,
	): Promise<ArrayBuffer> {
		void request;
		void response;

		return data;
	}
}

// Main extension class
export class MangaWorldExtension
	implements ContentTemplateImplementation, SearchResultsProviding, MangaProviding, ChapterProviding {
	// Implementation of the main rate limiter
	mainRateLimiter = new BasicRateLimiter("main", {
		numberOfRequests: 15,
		bufferInterval: 10,
		ignoreImages: true,
	});
	baseUrl = MW_DOMAIN;
	RETRIES = 10;
	parser = new Parser();

	// Implementation of the main interceptor
	mainInterceptor = new MainInterceptor("main");

	// Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
	async initialise(): Promise<void> {
		this.mainRateLimiter.registerInterceptor();
		this.mainInterceptor.registerInterceptor();
	}

	// Implements the settings form, check SettingsForm.ts for more info
	async getSettingsForm(): Promise<Form> {
		return new SettingsForm();
	}

	async getSearchFilters(): Promise<SearchFilter[]> {
		return [
			{
				id: "search-filter-template",
				type: "dropdown",
				options: [
					{ id: "include", value: "include" },
					{ id: "exclude", value: "exclude" },
				],
				value: "Exclude",
				title: "Search Filter Template",
			},
		];
	}

	// Populates search
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

	// Populates the title details
	async getMangaDetails(mangaId: string): Promise<SourceManga> {
		console.log(mangaId);
		const data = (await Application.scheduleRequest({
			url: `${this.baseUrl}/manga/${mangaId}`,
			method: "GET",
		}))[1];
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		return this.parser.parseMangaDetails($, mangaId);
	}

	// Populates the chapter list
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

	// Populates a chapter with images
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

	async getCloudflareBypassRequestAsync() {
		return Application.scheduleRequest({
			url: this.baseUrl,
			method: "GET",
			headers: {
				referer: `${this.baseUrl}/`,
				origin: `${this.baseUrl}/`,
				"user-agent": await Application.getDefaultUserAgent(),
			},
		});
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
	async getDiscoverSections(): Promise<DiscoverSection[]> {
		return [
			{
				id: "mese_section",
				title: "Manga del Mese",
				type: DiscoverSectionType.featured,
			},
			{
				id: "updated_section",
				title: "Aggiornati di Recente",
				type: DiscoverSectionType.chapterUpdates,
			},
			{
				id: "popular_section",
				title: "In Tendenza",
				type: DiscoverSectionType.featured,
			},
			{
				id: "new_manga_section",
				title: "Nuove Aggiunte",
				type: DiscoverSectionType.simpleCarousel,
			}
		];
	}
	/*
	getTagSections($): DiscoverSection[] {
		const uniqueGroups = new Set<string>();
		const sections: DiscoverSection[] = [];

		for (const tag of this.parser.parseTags($, this.baseUrl)) {
			const group = tag.data.attributes.group;

			if (!uniqueGroups.has(group)) {
				uniqueGroups.add(group);
				sections.push({
					id: group,
					title: group.charAt(0).toUpperCase() + group.slice(1),
					type: DiscoverSectionType.genres,
				});
			}
		}
		return sections;
	}
	*/
	async getDiscoverSectionItems(section: DiscoverSection,
								  metadata: unknown | undefined): Promise<PagedResults<DiscoverSectionItem>> {
		const data = (await Application.scheduleRequest({
			url: `${this.baseUrl}`,
			method: "GET",
		}))[1]
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		let type = "simpleCarouselItem"
		const mangas: [Promise<PagedResults<DiscoverSectionItem>>] = await this.parser.parseInTendenzaMese($)
		switch (section.id) {
			case "mese_section":
				return mangas[0]
			case "popular_section":
				return await this.parser.parseInTendenzaOggi($);
			case "updated_section":
				return await this.parser.parseLastAddedSetcion($)
			case "new_manga_section":
				return mangas[1]
			default:
				return { items: [] }
		}
	}
}

export const MangaWorld = new MangaWorldExtension