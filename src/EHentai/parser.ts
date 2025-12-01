import {
    ContentRating,
    DiscoverSectionItem,
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
import { CheerioAPI } from "cheerio";
import { Requests } from "./network";
import { GalleryInfo, Metadata } from "./utils";

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

    async parseFeatured(): Promise<PagedResults<DiscoverSectionItem>> {
        const html = await network.getPopular();
        const $ = cheerio.load(html);
        const results: DiscoverSectionItem[] = [];
        $(".gl1t").each((i, el) => {
            const container = $(el);
            const title = container.find(".gl4t.glname.glink").text().trim();
            const url = container.find("a").first().attr("href");
            const image = container.find("img").attr("src");
            results.push({
                type: "prominentCarouselItem",
                mangaId: url?.replace("https://e-hentai.org/g/", "") ?? "",
                title: title,
                imageUrl: image ?? "",
                contentRating: ContentRating.ADULT,
            });
        });
        return { items: results };
    }

    async parseRecent() {
        const results: DiscoverSectionItem[] = [];
        const html = await network.getRecent();
        const $ = cheerio.load(html);
        $(".gl1t").each((i, el) => {
            const container = $(el);
            const title = container.find(".gl4t.glname.glink").text().trim();
            const url = container.find("a").first().attr("href");
            const image = container.find("img").attr("src");
            results.push({
                type: "simpleCarouselItem",
                mangaId: url?.replace("https://e-hentai.org/g/", "") ?? "",
                title: title,
                imageUrl: image ?? "",
                contentRating: ContentRating.ADULT,
            });
        });
        return { items: results };
    }

    async parseMangaDetail(mangaID: string): Promise<SourceManga> {
        const html = await network.mangaDetailRequest(mangaID);
        const tags: Tag[] = [];
        const $ = cheerio.load(html);
        const additionalMangaInfo = this.parseGalleryInfo($);
        tags.push({
            id: additionalMangaInfo.category.toLowerCase(),
            title: additionalMangaInfo.category.toLowerCase(),
        });
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
        const normalized = additionalMangaInfo.posted.replace(" ", "T");
        const info: MangaInfo = {
            thumbnailUrl: imageUrl ?? "",
            synopsis: "",
            author: additionalMangaInfo.uploader.name,
            rating: additionalMangaInfo.rating.average / 500,
            secondaryTitles: [""],
            primaryTitle: title ?? "",
            contentRating: ContentRating.ADULT,
            tagGroups: tagSectionList,
            additionalInfo: {
                pages: additionalMangaInfo.length.pages.toString(),
                language: additionalMangaInfo.language.text,
                uploaded: normalized,
            },
        };
        return { mangaId: mangaID, mangaInfo: info };
    }

    async parseChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return [
            {
                chapterId: sourceManga.mangaId,
                sourceManga: sourceManga,
                langCode:
                    sourceManga.mangaInfo?.additionalInfo?.language ?? "LANG",
                additionalInfo: {
                    pages: sourceManga.mangaInfo?.additionalInfo?.pages ?? "0",
                },
                version: `${sourceManga.mangaInfo?.additionalInfo?.pages ?? "0"} pages`,
                publishDate: new Date(
                    sourceManga.mangaInfo?.additionalInfo?.uploaded ?? "",
                ),
                chapNum: 1,
            },
        ];
    }

    async scrapeAllChapterPages(chapter: Chapter) {
        const images = await this.scrapeAllChapterPagesList(chapter);
        return {
            id: chapter.chapterId,
            mangaId: chapter.chapterId,
            pages: images,
        };
    }

    private parseGalleryInfo($: CheerioAPI): GalleryInfo {
        const root = $("#gmid #gd3");
        const category = root.find("#gdc div").first().text().trim();
        const uploaderName = root.find("#gdn a").first().text().trim();
        function getRow(label: string): string {
            return $(`#gdd .gdt1:contains("${label}")`)
                .next(".gdt2")
                .text()
                .trim();
        }
        const posted = getRow("Posted:");
        const languageRaw = getRow("Language:");
        const lengthRaw = getRow("Length:");
        const ratingAverage = parseFloat(
            $("#rating_label")
                .text()
                .replace("Average:", "")
                .replace(".", "")
                .trim(),
        );
        return {
            category: category,
            uploader: {
                name: uploaderName,
            },
            posted: posted,
            language: {
                text: languageRaw,
            },
            length: {
                pages: parseInt(lengthRaw),
            },
            rating: {
                average: ratingAverage,
            },
        };
    }

    async scrapeAllChapterPagesList(chapter: Chapter) {
        let page = 0;
        const totalImages = chapter?.additionalInfo?.pages ?? "0";
        const results: string[] = [];
        while (true) {
            const html = await network.getChapterPages(
                `https://e-hentai.org/g/${chapter.chapterId}?p=${page}`,
            );
            const $ = cheerio.load(html);
            $("a[href^='https://e-hentai.org/s/']").each((i, el) => {
                const url = $(el).attr("href");
                if (url) results.push(url);
            });
            if (results.length >= Number(totalImages)) break;
            page++;
        }
        return results;
    }
}
