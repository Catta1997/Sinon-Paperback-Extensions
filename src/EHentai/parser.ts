import {
    ContentRating,
    MangaInfo,
    PagedResults,
    SearchQuery,
    SearchResultItem,
    Tag,
    TagSection,
    type Chapter,
    type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { Requests } from "./network";
import { Metadata } from "./utils";

const network = new Requests();
export class Parser {
    async parseSearchResults(
        query: SearchQuery,
        metadata: Metadata,
    ): Promise<PagedResults<SearchResultItem>> {
        const html = await network.searchRequest(query, metadata);
        const $ = cheerio.load(html);
        const results: SearchResultItem[] = [];
        $(".gl1t").each((i, el) => {
            const container = $(el);
            const title = container.find(".gl4t.glname.glink").text().trim();
            const url = container.find("a").first().attr("href");
            const image = container.find("img").attr("src");
            results.push({
                mangaId: url?.replace("https://e-hentai.org/g/", "") ?? "",
                title: title,
                imageUrl: image ?? "",
                contentRating: ContentRating.ADULT,
            });
        });
        let nextValue = "";
        const nextEl = $("#unext");
        if (nextEl.is("a")) {
            const href = nextEl.attr("href") || "";
            const match = href.match(/next=([^&]+)/);
            nextValue = match ? match[1] : "";
        }
        return {
            items: results,
            metadata: nextValue.length > 0 ? { page: nextValue } : undefined,
        };
    }

    async parseMangaDetail(mangaID: string): Promise<SourceManga> {
        const html = await network.mangaDetailRequest(mangaID);
        const tags: Tag[] = [];
        const $ = cheerio.load(html);
        $("#taglist a").each((i, el) => {
            const id = $(el).attr("id") || "";
            const title = $(el).text().trim();
            tags.push({ id: id, title: title });
        });
        const style = $("#gd1 > div").attr("style") || "";
        const match = style.match(/url\(([^)]+)\)/);
        const imageUrl = match ? match[1] : "";
        const title = $("#gn").text().trim();
        const tagSectionList: TagSection[] = [
            {
                id: "genres",
                title: "genres",
                tags: tags,
            },
        ];
        const info: MangaInfo = {
            thumbnailUrl: imageUrl ?? "",
            synopsis: "",
            secondaryTitles: [""],
            primaryTitle: title ?? "",
            contentRating: ContentRating.ADULT,
            tagGroups: tagSectionList,
        };
        return { mangaId: mangaID, mangaInfo: info };
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

    async getNewURL(url: string) {
        const data = await Application.scheduleRequest({
            url: url,
            method: "GET",
        });
        const html = Application.arrayBufferToUTF8String(data[1]);
        const $ = cheerio.load(html);
        const div = $("#i3");
        return div.find("img#img").attr("src") ?? url;
    }

    async scrapeAllChapterPages(chapterId: string) {
        const images = await this.scrapeAllChapterPagesList(chapterId);
        return {
            id: chapterId,
            mangaId: chapterId,
            pages: images,
        };
    }

    async scrapeAllChapterPagesList(chapterId: string) {
        let page = 0;
        let totalImages = null;
        const results: string[] = [];
        while (true) {
            const html = await network.getChapterPages(
                `https://e-hentai.org/g/${chapterId}p=${page}`,
            );
            const $ = cheerio.load(html);
            if (totalImages === null) {
                const text = $(".gpc").text();
                const match = text.match(/of\s+(\d+)\s+images/);
                if (match) {
                    totalImages = Number(match[1]);
                } else {
                    throw new Error(
                        "Impossibile determinare il numero totale di immagini!",
                    );
                }
            }
            $("a[href^='https://e-hentai.org/s/']").each((i, el) => {
                const url = $(el).attr("href");
                if (url) results.push(url);
            });
            if (results.length >= totalImages) break;
            page++;
        }
        return results;
    }
}
