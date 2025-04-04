import {
	Chapter,
	ChapterDetails,
	DiscoverSectionItem,
	SourceManga,
	Tag,
	TagSection
} from "@paperback/types";
import { ContentRating, MangaInfo, SearchResultItem } from "@paperback/types/lib";
import * as cheerio from "cheerio";
import {Metadata} from "./helper";
import {CheerioAPI} from "cheerio";
interface FilterOption {
	id: string;
	value: string;
}

export class Parser {

	getRating(tags:string[]): ContentRating {
		let rating: ContentRating = ContentRating.EVERYONE;
		for (const tag of tags){
			if (["ADULTI", "SMUT", "HENTAI"].includes(tag.toUpperCase())) {
				rating = ContentRating.ADULT
				break
			}
			if (["MATURO","DOUJINSHI","HORROR","TRAGICO","ECCHI"].includes(tag.toUpperCase())){
				rating = ContentRating.MATURE
				break
			}
		}
		return rating;
	}
	parseMangaDetails($: CheerioAPI, mangaId: string): SourceManga {
		const title: string = $(".name.bigger").text().trim() ?? ""
		const image: string = $(".thumb.mb-3.text-center img").attr("src") ?? ""
		const desc: string = $("#noidungm").text().trim() ?? ""
		const artists: string[] = []
		const authors: string[] = []
		const titles: string[] = []
		const data = {
			genre: [] as string[],
			state: "",
		};
		for (const obj of $(".meta-data.row.px-1 .col-12").toArray()) {
			const text = $(obj).text().trim();
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
				secondaryTitles: titles
			} as MangaInfo,
		} as SourceManga;
	}

	parseChapters($: CheerioAPI, sourceManga: SourceManga): Chapter[] {
		const chapters: Chapter[] = [];
		const arrChapters = $(".chapter").toArray().reverse();
		for (const item of arrChapters) {
			const href = $("a", item).attr("href") ?? "";
			const regex = /\/manga\/\d+\/([^/]+\/read\/[a-zA-Z0-9]+)/;
			const match = href.match(regex);
			const extractedPart = match ? match[1] : "";
			const id = extractedPart.replace("/read/", "_read_");
			const name = $("a", item).attr("title") ?? "";
			const chapNum =
				Number($(".d-inline-block", item).text().split(" ")[1])
			const chapter = isNaN(chapNum) ? 1 : chapNum
			const date = $("i.text-right.text-muted.chap-date", item).text()
			chapters.push({
				chapterId: id,
				sourceManga: sourceManga,
				langCode: "it",
				chapNum: chapter,
				title: name,
				publishDate: this.getDate(date),
			});
		}
		return chapters;
	}

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

	parseSearchResults($: CheerioAPI): SearchResultItem[] {
		const results: SearchResultItem[] = [];
		const tags :string[] = []
		for (const item of $(".comics-grid .entry").toArray()) {
			const tmp =
				(($("a", item).attr("href") ?? "").match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? [
					"null",
				])[0] ?? "";
			const id = tmp.split("/")[0] ?? "";
			const title = $("a", item).attr("title") ?? "";
			const image = $("a img", item).attr("src") ?? "";
			$("div.genres", item)
				.find("a")
				.each(function (_, e) {
					tags.push($(e).text().trim())
				});

			results.push({
				imageUrl: image,
				title: title,
				mangaId: id,
				contentRating: this.getRating(tags)
			});
		}
		return results;
	}

	numberPage:number = 0
	parseCapitoliInTendenza($: CheerioAPI, metadata: Metadata): { items: DiscoverSectionItem[] } {
		const trending: DiscoverSectionItem[] = []
		const arrTrending = $('.entry.vertical').toArray()
		for (const obj of arrTrending) {
			const tmp = (($('a', obj).attr('href') ?? '').match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? ['null'])[0] ?? ''
			const id = tmp.split("/")[0] ?? ""
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

	parseInTendenzaMese($: CheerioAPI, metadata: Metadata): [{ items: DiscoverSectionItem[]; metadata: Metadata }, {
		items: DiscoverSectionItem[];
		metadata: Metadata
	}] {
		const arrHotTitle = $('.col-12 .top-wrapper .entry').toArray()
		const hot: DiscoverSectionItem[] = []
		const newTitle: DiscoverSectionItem[] = []
		for (const obj of arrHotTitle) {
			const tmp = (($('a', obj).attr('href') ?? '').match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? ['null'])[0] ?? ''
			const id = tmp.split("/")[0] ?? ""
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
			else if (newTitle.length < 5) {
				newTitle.push({
					metadata: metadata,
					type:'simpleCarouselItem',
					contentRating: undefined,
					imageUrl: image,
					mangaId: id,
					title: title
				})
			}
		}
		return[
			{items: hot, metadata: metadata},
			{ items: newTitle ,metadata: metadata}
		]
	}

	//parse ultime aggiunte
	async parseLastAddedSetcion2(metadata: Metadata): Promise<{
		items: DiscoverSectionItem[];
		metadata: Metadata | undefined
	}>
	{
		console.log("ParseLastAddedSetcion2")
		const latest: DiscoverSectionItem[] = []
		let page = metadata?.page ?? 1
	//	if (metadata?.page == undefined) metadata = { page: 1 }
		const data = (await Application.scheduleRequest({
			url: `https://www.mangaworld.nz/archive?sort=newest&page=${page}`,
			method: "GET",
		}))[1]
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		page++
		for (const item of $(".comics-grid .entry").toArray()) {
			const tmp =
				(($("a", item).attr("href") ?? "").match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? [
					"null",
				])[0] ?? "";
			const id = tmp.split("/")[0] ?? "";
			const title = $("a", item).attr("title") ?? "";
			const image = $("a img", item).attr("src") ?? "";
			latest.push({
				metadata: { page: page + 1 },
				type: 'simpleCarouselItem',
				contentRating: undefined,
				imageUrl: image,
				mangaId: id,
				title: title
			})
		}
		console.log(page)
		console.log(latest.length)
		return {items: latest, metadata: { page: page }};
	}

	//parse nuovi capitoli
	async parseLastAddedSetcion(metadata: Metadata): Promise<{
		items: DiscoverSectionItem[];
		metadata: Metadata | undefined
	}> {
		let page = metadata?.page ?? 1
		//	if (metadata?.page == undefined) metadata = { page: 1 }
		const data = (await Application.scheduleRequest({
			url: `https://www.mangaworld.nz?page=${page}`,
			method: "GET",
		}))[1]
		const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
		page++
		const arrLatest = $('.col-sm-12.col-md-8.col-xl-9 .comics-grid .entry').toArray()
		const latest: DiscoverSectionItem[] = []
		for (const obj of arrLatest) {
			const tmp: string = (($('a', obj).attr('href') ?? '').match(/[0-9]+\/[a-zA-Z0-9-]+/i) ?? ['null'])[0] ?? ''
			const id: string = tmp.split("/")[0] ?? ''
			const title: string = $('a', obj).attr('title') ?? ''
			const image: string = $('a img', obj).attr('src') ?? ''
			const sub: string = $('.d-flex.flex-wrap.flex-row a', obj).first().attr('title') ?? ''
			const chapterId: string = (($('.d-flex.flex-wrap.flex-row a', obj).attr('href') ?? '').match(/\/read+\/[a-zA-Z0-9-]+/i) ?? ['null'])[0] ?? ''
			const addedDate: string = $('i.ml-auto.mt-auto', obj).first().text().trimEnd()
			latest.push({
				chapterId: chapterId.replace("/read/", "_read_"), //todo
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
		return {items: latest, metadata: {page: page}};
	}
	async parseGenresFilters(url: string) {
		console.log("ParseFilterGenres")
		const genres: FilterOption[] = []
		const data :ArrayBuffer = (await Application.scheduleRequest({
			url: `${url}`,
			method: "GET",
		}))[1]
		const $: CheerioAPI = cheerio.load(Application.arrayBufferToUTF8String(data))
		let first_label :string = ''
		let i :number = 0
		for (const item of $('.dropdown-menu.dropdown-multicol .dropdown-item').toArray()) {
			//const id :string = $(item).attr('href')?.replace(`${url}/archive?genre=`, '') ?? ''
			const label :string = $(item).text().trim()
			if (i == 0) first_label = label
			if (label == first_label && i > 0) break
			genres.push({ value: label, id: label.replaceAll(" ","-") })
			i++
		}
		return genres
	}
	getDate(dataString: string): Date {
		const mesi: { [key: string]: number } = {
			"Gennaio": 0, "Febbraio": 1, "Marzo": 2, "Aprile": 3,
			"Maggio": 4, "Giugno": 5, "Luglio": 6, "Agosto": 7,
			"Settembre": 8, "Ottobre": 9, "Novembre": 10, "Dicembre": 11
		};
		const oggi = new Date(); // Se la stringa è errata, restituisci oggi
		const parts :string[] = dataString.split(" ");
		if (parts.length === 2) {
			parts.push(oggi.getFullYear().toString())
		}
		if (parts.length > 3) return new Date(oggi.getFullYear(),oggi.getMonth(),oggi.getDay()) // Controlla che ci siano esattamente due elementi
		const mese :number = parseInt(parts[0], 10);
		const giorno :number = mesi[parts[1]];
		const anno :number = parseInt(parts[2], 10);
		if (isNaN(giorno) || (isNaN(anno)) || mese === undefined) return oggi; // Se non è valido, restituisci oggi
		return new Date(anno,giorno,mese)
	}
	async parseTypeFilters(url: string) {
		console.log("ParseFilterType")
		const types: FilterOption[] = []
		const data :ArrayBuffer = (await Application.scheduleRequest({
			url: `${url}`,
			method: "GET",
		}))[1]
		const $ :CheerioAPI = cheerio.load(Application.arrayBufferToUTF8String(data))
		let first_label :string = ''
		let i :number = 0
		for (const item of $('.dropdown-menu[aria-labelledby="typesDropdown"] .dropdown-item').toArray()) {
			//<div class="dropdown-menu show" aria-labelledby="typesDropdown" id="typesDropdownMenu">
			//const id :string = $(item).attr('href')?.replace(`${url}/archive?type=`, '') ?? ''
			const label :string = $(item).text().trim()
			if (i == 0) first_label = label
			if (label == first_label && i > 0) break
			types.push({ value: label, id: label.replaceAll(" ","-") })
			i++
		}
		return types
	}
}
