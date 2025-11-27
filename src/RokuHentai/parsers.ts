import {
    Chapter,
    ChapterDetails,
    ContentRating,
    MangaInfo,
    PagedResults,
    SearchQuery,
    SearchResultItem,
    SourceManga,
    Tag,
    type SearchFilter,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { Requests } from "./network";
import { filter_lang, filter_tags, MangaCardInfo, RokuMetadata } from "./utils";

const requestMaker = new Requests();

export class Parser {
    async parseSearchResult(
        query: SearchQuery,
        metadata: RokuMetadata,
    ): Promise<PagedResults<SearchResultItem>> {
        const items: SearchResultItem[] = [];
        const parsed = await requestMaker.requestSearchResults(query, metadata);
        parsed["manga-cards"].forEach((card) => {
            const manga = this.parseMangaCard(card);
            if (manga.title && manga.id) {
                items.push({
                    mangaId: manga.id,
                    title: manga.title,
                    subtitle: manga.subtitle,
                    imageUrl: manga.coverImage ?? "coverImage",
                    contentRating: ContentRating.ADULT,
                });
            }
        });
        return {
            items: items,
            metadata: parsed.next !== null ? { page: parsed.next } : undefined,
        };
    }

    async parseMangaDetails(mangaId: string): Promise<SourceManga> {
        const html = await Application.scheduleRequest({
            url: `https://rokuhentai.com/${mangaId}`,
            method: "GET",
        });
        const data = Application.arrayBufferToUTF8String(html[1]);
        const $ = cheerio.load(data);
        const title = $("title").text();
        const text = $(
            ".mdc-typography--caption.site-manga-info__title-text",
        ).text();
        const desc = $('meta[name="description"]').attr("content") || "";
        const tags = desc.split(",").map((s) => s.trim());
        tags.shift();
        const match = text.match(/\d+/);
        const imagesCount = match ? match[0] : "0";
        const tagGroup: Tag[] = tags.map((tag) => ({
            id: "genre",
            title: tag,
        }));
        const mangaDetails: MangaInfo = {
            thumbnailUrl: `https://rokuhentai.com/_images/cover-thumbnails/${mangaId}.jpg`,
            synopsis: "",
            primaryTitle: title.split(" - Roku")[0],
            secondaryTitles: [],
            contentRating: ContentRating.ADULT,
            additionalInfo: { pages: imagesCount },
            tagGroups: [{ id: "genres", title: "genres", tags: tagGroup }],
        };
        return {
            mangaId: mangaId,
            mangaInfo: mangaDetails,
        };
    }

    async parseChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const manga_pages: string[] = [];
        for (
            let page = 0;
            page < Number(chapter.sourceManga.mangaInfo.additionalInfo?.pages);
            page++
        ) {
            manga_pages.push(
                `https://rokuhentai.com/_images/pages/${chapter.sourceManga.mangaId}/${page}.jpg`,
            );
        }
        return {
            id: chapter.chapterId,
            mangaId: chapter.sourceManga.mangaId,
            pages: manga_pages,
        };
    }

    async parseChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return [
            {
                chapterId: sourceManga.mangaId,
                sourceManga: sourceManga,
                langCode: "",
                chapNum: 1,
            },
        ];
    }

    parseMangaCard(html: string): MangaCardInfo {
        const $ = cheerio.load(html);
        const root = $(".site-manga-card");
        let id = root.attr("id") || undefined;
        const coverStyle =
            root.find(".site-manga-card__media--japanese-b6").attr("style") ||
            "";
        const coverImageMatch = coverStyle.match(/url\(["']?(.*?)["']?\)/);
        const coverImage = coverImageMatch ? coverImageMatch[1] : undefined;
        const title =
            root.find(".site-manga-card__title--primary").text().trim() ||
            undefined;
        const subtitle =
            root.find(".site-manga-card__title--secondary").text().trim() ||
            undefined;
        id = id?.split("site-manga-card-")[1];
        return {
            id,
            coverImage,
            title,
            subtitle,
        };
    }

    getFilters() {
        const filters: SearchFilter[] = [];
        filters.push({
            type: "multiselect",
            id: "languages",
            title: "Language",
            options: filter_lang,
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: filter_lang.length,
        });
        filters.push({
            type: "multiselect",
            id: "tags",
            title: "Tags",
            options: filter_tags,
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: filter_tags.length,
        });
        return filters;
    }
}

/*
NIFTeam -> orribile
Anime GDR Club -> no https,
DigitalTeam -> meh
 */
