import {parser} from "typescript-eslint";

// TODO:
// - Add the English name to the title view
// - Add additional info to the title view
// - Make getChapterDetails only return new chapters
// - Fix exclude search

import { BasicRateLimiter, Chapter, ChapterDetails, ChapterProviding, DiscoverSection, DiscoverSectionItem, DiscoverSectionProviding, Extension, Form, MangaProviding, PagedResults, PaperbackInterceptor, Request, Response, SearchFilter, SearchQuery, SearchResultItem, SearchResultsProviding, SettingsFormProviding, SourceManga } from "@paperback/types";
import { Parser } from "../parser";
// Extension settings file
import { SettingsForm } from "../SettingsForm";
import { Functions } from "../Functions";

const MW_DOMAIN = "https://www.mangaworldadult.net";
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
export class MangaAdultExtension
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
	functions = new Functions(MW_DOMAIN);

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
		return this.functions.getSearchResults(query,metadata)
	}

	// Populates the title details
	async getMangaDetails(mangaId: string): Promise<SourceManga> {
		console.log(mangaId);
		return this.functions.getMangaDetails(mangaId)
	}

	// Populates the chapter list
	async getChapters(
		sourceManga: SourceManga,
		sinceDate?: Date,
	): Promise<Chapter[]> {
		return this.functions.getChapters(sourceManga,sinceDate)
	}

	// Populates a chapter with images
	async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
		return  this.functions.getChapterDetails(chapter)
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

	async getDiscoverSections(): Promise<DiscoverSection[]> {
		return this.functions.getDiscoverSections()
	}

	async getDiscoverSectionItems(section: DiscoverSection,
								  metadata: unknown | undefined): Promise<PagedResults<DiscoverSectionItem>> {
		return this.functions.getDiscoverSectionItems(section,undefined)
	}
}

export const MangaAdult = new MangaAdultExtension