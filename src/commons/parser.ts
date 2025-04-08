import {
	Chapter,
	ChapterDetails,
	DiscoverSectionItem,
	SourceManga,
	Tag,
	TagSection
} from "@paperback/types";
import { ContentRating, MangaInfo, SearchResultItem } from "@paperback/types/lib";
import {Metadata} from "./helper";
import * as cheerio from "cheerio"
import {CheerioAPI} from 'cheerio';


export class Parser {

	/**
	 * controllo Tag Blacklistati da impostaioni
	 * @param tags : string[] - tags
	 * @type {tags:string[]} => boolean
	 * @return {boolean} - true: da nascondere
	 */
	blacklistedTags(tags: string[]): boolean {
		const Bl_tags = (Application.getState("hide_tags") as
			| string[]
			| undefined) ?? []
		console.log("Blacklisted Tags Loaded: " + Bl_tags.join(","))

		for (const tag of tags) {
			if (Bl_tags.includes(tag.toLowerCase())) {
				console.log("Detected :" + tag + " manga rimosso dalla lista")
				return true;
			}
		}
		return false;
	}

	/**
	 * controllo Tipi Manga Blacklistati da impostaioni
	 * @type {tags:string[]} => boolean
	 * @return {boolean} - true: da nascondere
	 * @param type
	 */
	blacklistedType(type: string): boolean {
		const Bl_tags = (Application.getState("hide_type") as
			| string[]
			| undefined) ?? []
		console.log("Blacklisted Type Loaded: " + Bl_tags.join(","))
		if (Bl_tags.includes(type.toLowerCase())) {
			console.log("Detected :" + type + " manga rimosso dalla lista")
			return true;
		}
		return false;
	}

	/**
	 * Ottieni Rating dati tags
	 * @param tags : string[] - tags
	 * @type {tags:string[]} => ContentRating
	 * @return {ContentRating} - ContentRating
	 */
	getRating(tags:string[]): ContentRating {
		let rating: ContentRating = ContentRating.EVERYONE;
		for (const tag of tags){
			if ([
				"ADULTI", "HENTAI", "LOLICON", "SHOTACON", "YAOI", "YURI", "DOUJINSHI"
			].includes(tag.toUpperCase())) {
				rating = ContentRating.ADULT;
				break;
			} else if ([
				"MATURO", "ECCHI", "SMUT", "HAREM", "GENDER BENDER",
				"SHOUJO AI", "SHOUNEN AI", "HORROR", "TRAGICO"
			].includes(tag.toUpperCase())) {
				rating = ContentRating.MATURE;
				break;
			}
		}
		return rating;
	}

	/**
	 * Ottieni dettagli Manga
	 * @param $ : CheerioAPI - Richiesta
	 * @param mangaId : string - MangaID
	 * @return {SourceManga} - SourceManga
	 */
	parseMangaDetails($: CheerioAPI, mangaId: string): SourceManga {
		const title: string = $(".name.bigger").text().trim() ?? ""
		const image: string = $(".thumb.mb-3.text-center img").attr("src") ?? ""
		const desc: string = $("#noidungm").text().trim() ?? ""
		let subs: string = ""
		const artists: string[] = []
		const authors: string[] = []
		const titles: string[] = []
		const data = {
			genre: [] as string[],
			state: "",
		};
		for (const obj of $(".meta-data.row.px-1 .col-12").toArray()) {
			const text = $(obj).text().trim();
			if (text.includes("Fansub")) {
				subs = $(obj).find("a").first().text().trim();
			}
			if (text.includes("Stato")) {
				const stateLink = $(obj).find("a").first();
				if (stateLink.length) data.state = stateLink.text().trim();
			} else if (text.includes("Artist")) {
				$(obj)
					.find("a")
					.each(function (_, e) {
						artists.push($(e).text().trim())
					});
			} else if (text.includes("Autor")) {
				$(obj)
					.find("a")
					.each(function (_, e) {
						authors.push($(e).text().trim())
					});
			} else if (text.includes("Gener")) {
				$(obj)
					.find("a")
					.each(function (_, e) {
						data.genre.push($(e).text().trim())
					});
			}
			else if (text.includes("Titol")) {
				let t = $(obj).text().trim()
				t = t.slice(t.indexOf(":")+1, t.length)
				t.split(",").forEach((element: string) => {
                    titles.push(element.trim());
                });
			}
		}

		const author = authors.join(", ");
		const artist = artists.join(", ");
		const status = data.state;
		const arrayTags: Tag[] = [];
		for (const tag of data.genre) {
			arrayTags.push({ title: tag, id: tag.replaceAll(" ","-") });
		}
		const rating: ContentRating = this.getRating(arrayTags.map(tag => tag.title))
		const tagSections: TagSection[] = [
			{ id: "genres", title: "genres", tags: arrayTags },
		];
		return {
			mangaId: mangaId,
			mangaInfo: {
				artist: artist,
				thumbnailUrl: image,
				synopsis: desc,
				primaryTitle: title,
				contentRating: rating,
				status: status,
				author: author,
				tagGroups: tagSections,
				secondaryTitles: titles,
				additionalInfo: {subs: subs}
			} as MangaInfo,
		} as SourceManga;
	}

	/**
	 * Ottieni Lista Capitoli
	 * @param $ : CheerioAPI - Richiesta
	 * @param sourceManga : SourceManga - Manga
	 * @return {Chapter[]} - Capitoli
	 */
	parseChapters($: CheerioAPI, sourceManga: SourceManga): Chapter[] {
		const chapters: Chapter[] = [];
		const arrChapters = $(".chapter").toArray().reverse();
		for (const item of arrChapters) {
			const href = $("a", item).attr("href") ?? "";
			const chapterId = (href.match(/read\/([^/]+)+/i) ?? ['null', ''])[1];
			console.log("ID " + chapterId)
			const name = $("a", item).attr("title") ?? "";
			const volN = ($(item).closest(".volume-element").find(".volume-name").text()).split(" ")[1]
			const chapN = ($(".d-inline-block", item).text().split(" ")[1])
			console.log("Volume " + volN);
			console.log("Capitolo " + volN);
			// trasformo in Number capitolo e volume
			const chapNum = isNaN(Number(chapN)) ? 1 : Number(chapN)
			const volumeNum = isNaN(Number(volN)) ? 1 : Number(volN);

			const date = $("i.text-right.text-muted.chap-date", item).text()
			chapters.push({
				chapterId: chapterId,
				sourceManga: sourceManga,
				volume: volumeNum,
				version: sourceManga.mangaInfo.additionalInfo?.subs ?? "",
				langCode: "it",
				chapNum: chapNum,
				title: name,
				publishDate: this.getDate(date),
			});
		}
		return chapters;
	}

	/**
	 * Parsing dettagli capitolo
	 * @param $ : CheerioAPI - Richiesta
	 * @param mangaId : string - ID manga
	 * @param id : string - ID capitolo
	 * @return {{
	 *   id: string
	 *   mangaId: string
	 *   pages: string[]
	 * }} - Dettagli
	 */
	parseChapterDetails($: CheerioAPI, mangaId: string, id: string): ChapterDetails {
		const pages: string[] = [];
		for (const item of $(
			".col-12.text-center.position-relative img",
		).toArray()) {
			const imageUrl = $(item).attr("src");
			if (!imageUrl) continue;
			pages.push(imageUrl.trim());
		}
		return {
			id: id,
			mangaId: mangaId,
			pages: pages,
		};
	}

	/**
	 * Parsing pegina
	 * @param $ : CheerioAPI - Richiesta
	 * @return {{id:string,title:string,image:string,tags:string[]}[]}
	 */
	parsePage($: CheerioAPI): {id:string,title:string,image:string,tags:string[], authors: string, type: string}[]{
		const items :{id:string,title:string,image:string,tags:string[], authors: string, type: string}[] = []
		for (const item of $(".comics-grid .entry").toArray()) {
			const id =
				(($("a", item).attr("href") ?? "").match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? [
					"null",
				])[0] ?? "";
			console.log("MangaID " + id)
			const authors: string[] = []
			const tags :string[] = []
			$("div.author", item)
				.find("a")
				.each(function (_, e) {
					authors.push($(e).text().trim())
				});
			const title = $("a", item).attr("title") ?? "";
			const image = $("a img", item).attr("src") ?? "";
			const mangaType = $("div.genre", item).find("a").text().trim();
			$("div.genres", item)
				.find("a")
				.each(function (_, e) {
					tags.push($(e).text().trim())
				});
			console.log("MangaTypeSearch " + mangaType)
			const author:string = authors.join(", ")
			items.push({id:id,title:title,image:image,tags:tags, authors:author, type: mangaType})
		}
		return items;
	}
	/**
	 * Parsing ricerca
	 * @param $ : CheerioAPI - Richiesta
	 * @return items: SearchResultItem[]
	 */
	parseSearchResults($: CheerioAPI): SearchResultItem[] {
		const results: SearchResultItem[] = [];
		const parse = this.parsePage($)
		for (const item of parse) {
			if(!this.blacklistedTags(item.tags) && !this.blacklistedType(item.type)) {
				results.push({
					imageUrl: item.image,
					title: item.title,
					subtitle: item.authors,
					mangaId: item.id,
					contentRating: this.getRating(item.tags)
				});
			}
		}
		return results;
	}

	/**
	 * Parsing capitoli in tendenza
	 * @param metadata : Metadata - metadata
	 * @param $ : CheerioAPI - Richiesta
	 * @return { items: DiscoverSectionItem[] }
	 */
	parseCapitoliInTendenza($: CheerioAPI, metadata: Metadata): { items: DiscoverSectionItem[] } {
		const trending: DiscoverSectionItem[] = []
		const arrTrending = $('.entry.vertical').toArray()
		for (const obj of arrTrending) {
			const id = (($('a', obj).attr('href') ?? '').match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? ['null'])[0] ?? ''
			console.log("MangaID " + id)
			const image = $('a img', obj).attr('src') ?? ''
			const chapNum = $('a div', obj).text() ?? ''
			const title = $('.manga-title', obj).text().trim()
			trending.push({
				metadata: metadata,
				type:'featuredCarouselItem',
				contentRating: undefined,
				supertitle: chapNum,
				imageUrl: image,
				mangaId: id,
				title: title
			})
		}
		return { items: trending }
	}

	/**
	 * Parsing in tendenza nel mese
	 * @param metadata : Metadata - metadata
	 * @param $ : CheerioAPI - Richiesta
	 * @return [
	 * 		{ items: DiscoverSectionItem[]; metadata: Metadata },
	 * 		{ items: DiscoverSectionItem[]; metadata: Metadata }
	 * 	]
	 */
	parseInTendenzaMese($: CheerioAPI, metadata: Metadata): { items: DiscoverSectionItem[]; metadata: Metadata } {
		const arrHotTitle = $('.col-12 .top-wrapper .entry').toArray()
		const hot: DiscoverSectionItem[] = []
		for (const obj of arrHotTitle) {
			const id = (($('a', obj).attr('href') ?? '').match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? ['null'])[0] ?? ''
			console.log("MangaID " + id)
			const image = $('.img-fluid', obj).attr('src') ?? ''
			const title = $('.name', obj).first().text().trim() ?? ''
			if (hot.length < 10) {
				hot.push({
					metadata: metadata,
					type:'prominentCarouselItem',
					contentRating: undefined,
					imageUrl: image,
					mangaId: id,
					title: title
				})
			}
		}
		return { items: hot, metadata: metadata }
	}

	/**
	 * Parsing ultimi manga agiunti
	 * @param metadata : Metadata - metadata
	 * @param url : string - Url
	 * @return { items: DiscoverSectionItem[]; metadata: Metadata }
	 */
	async parseLastMangaAddedSetcion(metadata: Metadata, url:string): Promise<{ items: DiscoverSectionItem[]; metadata: Metadata }>
	{
		const latest: DiscoverSectionItem[] = []
		let page = metadata?.page ?? 1

		const data = (await Application.scheduleRequest({
			url: `${url}/archive?sort=newest&page=${page}`,
			method: "GET",
		}))[1]
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		page++
		const parse = this.parsePage($)
		for (const item of parse) {
			if(!this.blacklistedTags(item.tags) && !this.blacklistedType(item.type)) {
				latest.push({
					metadata: { page: page + 1 },
					subtitle: item.authors,
					type: 'simpleCarouselItem',
					contentRating: this.getRating(item.tags),
					imageUrl: item.image,
					mangaId: item.id,
					title: item.title,
				})
			}
		}
		return {items: latest, metadata: { page: page }};
	}


	/**
	 * Parse nuovi capitoli
	 * @param metadata - manga metadata
	 * @param url - url
	 * @return {
	 * 		items: DiscoverSectionItem[];
	 * 		metadata: Metadata | undefined
	 * 	}
	 */
	async parseLastAddedSetcion(metadata: Metadata, url: string): Promise<{
		items: DiscoverSectionItem[];
		metadata: Metadata | undefined
	}> {
		let page = metadata?.page ?? 1
		//	if (metadata?.page == undefined) metadata = { page: 1 }
		const data = (await Application.scheduleRequest({
			url: `${url}?page=${page}`,
			method: "GET",
		}))[1]
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		page++
		const arrLatest = $('.col-sm-12.col-md-8.col-xl-9 .comics-grid .entry').toArray()
		const latest: DiscoverSectionItem[] = []
		for (const obj of arrLatest) {
			const id: string = (($('a', obj).attr('href') ?? '').match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? ['null'])[0] ?? ''
			console.log("MangaID " + id)
			const title: string = $('a', obj).attr('title') ?? ''
			const mangaType: string = $(".genre a", obj).text().trim() ?? ''
			console.log("MangaType " + mangaType)
			const image: string = $('a img', obj).attr('src') ?? ''
			const sub: string = $('.d-flex.flex-wrap.flex-row a', obj).first().attr('title') ?? ''
			const chapterId: string = (($('.d-flex.flex-wrap.flex-row a', obj).attr('href') ?? '')
				.match(/read\/(.*)\?+/i) ?? ['null', ''])[1];
			const addedDate: string = $('i.ml-auto.mt-auto', obj).first().text().trimEnd()
			console.log("ChapterID " + chapterId)
			if(!this.blacklistedType(mangaType)) {
				latest.push({
					chapterId: chapterId,
					publishDate: this.getDate(addedDate),
					metadata: metadata,
					type: 'chapterUpdatesCarouselItem',
					contentRating: undefined,
					imageUrl: image,
					mangaId: id,
					title: title,
					subtitle: sub
				})
			}
		}
		return {items: latest, metadata: {page: page}};
	}

	/**
	 * Trasforma una stringa in data
	 * @param dataString - data in formato stringa
	 * @return Date - stringa in formato data
	 */
	getDate(dataString: string): Date {
		const mesi: { [key: string]: number } = {
			"gennaio": 0, "febbraio": 1, "marzo": 2, "aprile": 3,
			"maggio": 4, "giugno": 5, "luglio": 6, "agosto": 7,
			"settembre": 8, "ottobre": 9, "novembre": 10, "dicembre": 11
		};
		const oggi = new Date();
		const parts = dataString.trim().toLowerCase().split(" ");
		if (parts.length < 2 || parts.length > 3) return oggi;
		const giorno = parseInt(parts[0], 10);
		const mese = mesi[parts[1]];
		let anno: number;
		if (isNaN(giorno) || mese === undefined) return oggi;
		if (parts.length === 3) {
			anno = parseInt(parts[2], 10);
			if (isNaN(anno)) return oggi;
		} else {
			const dataTemp = new Date(oggi.getFullYear(), mese, giorno);
			// Se la data futura non è ancora passata, prendiamo l'anno precedente
			if (dataTemp > oggi) {
				anno = oggi.getFullYear() - 1;
			} else {
				anno = oggi.getFullYear();
			}
		}
		return new Date(anno, mese, giorno);
	}
}
