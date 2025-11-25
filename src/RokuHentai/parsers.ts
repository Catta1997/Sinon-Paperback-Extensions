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
} from "@paperback/types";
import * as cheerio from "cheerio";
import { Requests } from "./network";
import { MangaCardInfo, RokuMetadata } from "./utils";

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
            metadata:
                parsed.next && parsed.next.length > 0
                    ? { page: parsed.next }
                    : undefined,
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
        const searchPagination =
            root.attr("data-search-pagination") || undefined;
        const detailsUrl =
            root.find("a.site-popunder-ad-slot").attr("href") || undefined;
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
        const extraInfo = root
            .find(".mdc-typography--caption")
            .first()
            .text()
            .trim();
        let imagesCount: number | undefined;
        let dateString: string | undefined;
        const imagesMatch = extraInfo.match(/(\d+)\s+images/);
        if (imagesMatch) imagesCount = parseInt(imagesMatch[1], 10);
        const dateMatch = extraInfo.match(/\d{1,2}\s\w+\s\d{4}.*$/);
        if (dateMatch) dateString = dateMatch[0];
        id = id?.split("site-manga-card-")[1];
        return {
            id,
            searchPagination,
            detailsUrl,
            coverImage,
            title,
            subtitle,
            imagesCount,
            dateString,
        };
    }
}
