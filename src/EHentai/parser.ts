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
import { GalleryInfo, getLangFlag, Metadata } from "./utils";

const network = new Requests();
export class Parser {
    private capitalLetter(str: string): string {
        return str
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
            .join(" ");
    }

    private parseTitle(str: string): string {
        return str
            .replaceAll(/(\[.*?]|\(.*?\))/g, "")
            .replaceAll(/\s+/g, " ")
            .trim();
    }

    private parseTable($: cheerio.CheerioAPI) {
        const results: {
            title: string;
            image: string;
            url: string;
            lang: string;
            artist: string;
            subtitle: string;
        }[] = [];
        $("tr")
            .has("td.gl1e")
            .each((i, el) => {
                const container = $(el);
                const title = container.find("div.glink").text().trim();
                const url = container.find("a").first().attr("href") ?? "";
                const image = container.find("img").attr("src") ?? "";
                let artist = "";
                let lang = "";
                container.find("td.tc").each((i, td) => {
                    if ($(td).text().trim() === "artist:") {
                        artist = $(td)
                            .next("td")
                            .find("div")
                            .first()
                            .text()
                            .trim();
                    }
                });
                container.find("td.tc").each((i, td) => {
                    if ($(td).text().trim() === "language:") {
                        const lang_text = $(td)
                            .next("td")
                            .find("div.gt")
                            .first()
                            .text()
                            .trim();
                        lang = getLangFlag(lang_text);
                    }
                });
                const subtitle = this.capitalLetter(
                    lang.length > 0 && artist.length > 0
                        ? `${lang} | ${artist}`
                        : lang.length > 0
                          ? `${lang}`
                          : artist.length > 0
                            ? `${artist}`
                            : "",
                );
                results.push({
                    title: title,
                    image: image,
                    url: url,
                    lang: lang,
                    artist: artist,
                    subtitle: subtitle,
                });
            });
        return results;
    }

    async parseSearchResults(
        query: SearchQuery,
        metadata: Metadata,
    ): Promise<PagedResults<SearchResultItem>> {
        const html = await network.searchRequest(query, metadata);
        const $ = cheerio.load(html);
        const results: SearchResultItem[] = this.parseTable($).map((item) => ({
            mangaId: item.url?.replaceAll("https://e-hentai.org/g/", "") ?? "",
            title: item.title
                .replaceAll(/(\[.*?]|\(.*?\))/g, "")
                .replaceAll(/\s+/g, " ")
                .trim(),
            imageUrl: item.image,
            subtitle: item.subtitle,
            contentRating: ContentRating.ADULT,
        }));
        if (results.length == 0) {
            return {
                items: [],
                metadata: undefined,
            };
        }
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
        const results: DiscoverSectionItem[] = this.parseTable($).map(
            (item) => ({
                type: "prominentCarouselItem",
                mangaId:
                    item.url?.replaceAll("https://e-hentai.org/g/", "") ?? "",
                title: item.title
                    .replaceAll(/(\[.*?]|\(.*?\))/g, "")
                    .replaceAll(/\s+/g, " ")
                    .trim(),
                subtitle: item.subtitle,
                imageUrl: item.image,
                contentRating: ContentRating.ADULT,
            }),
        );
        return { items: results };
    }

    async parseRecent() {
        const html = await network.getRecent();
        const $ = cheerio.load(html);
        const results: DiscoverSectionItem[] = this.parseTable($).map(
            (item) => ({
                type: "simpleCarouselItem",
                mangaId:
                    item.url?.replaceAll("https://e-hentai.org/g/", "") ?? "",
                title: item.title
                    .replaceAll(/(\[.*?]|\(.*?\))/g, "")
                    .replaceAll(/\s+/g, " ")
                    .trim(),
                subtitle: item.subtitle,
                imageUrl: item.image,
                contentRating: ContentRating.ADULT,
            }),
        );
        return { items: results };
    }

    async parseMangaDetail(mangaID: string): Promise<SourceManga> {
        const html = await network.mangaDetailRequest(mangaID);
        const $ = cheerio.load(html);
        const additionalMangaInfo = this.parseGalleryInfo($);
        const tagSectionList: TagSection[] = [];
        tagSectionList.push({
            id: "category",
            title: "Category",
            tags: [
                {
                    id: additionalMangaInfo.category.toLowerCase(),
                    title: additionalMangaInfo.category.toLowerCase(),
                },
            ],
        });
        $("#taglist tr").each((i, el) => {
            const row = $(el);

            const category = row.find("td.tc").text().trim().split(":")[0];

            const tags: Tag[] = row
                .find("td .gtl a, td .gt a")
                .map((i, a) => ({
                    id: $(a).attr("id") || "",
                    title: this.capitalLetter(
                        $(a).text().trim().replaceAll(/\s+/g, " ").trim(),
                    ),
                }))
                .get();
            tagSectionList.push({
                id: category,
                title: category,
                tags: tags,
            });
        });
        const style = $("#gd1 > div").attr("style") || "";
        const match = style.match(/url\(([^)]+)\)/);
        const imageUrl = match ? match[1] : "";
        const title = $("#gn").text().trim();
        const normalized = additionalMangaInfo.posted.replaceAll(" ", "T");
        const info: MangaInfo = {
            thumbnailUrl: imageUrl ?? "",
            synopsis: "",
            author: additionalMangaInfo.uploader.name,
            rating: additionalMangaInfo.rating.average / 500,
            secondaryTitles: [""],
            primaryTitle:
                title
                    .replaceAll(/(\[.*?]|\(.*?\))/g, "")
                    .replaceAll(/\s+/g, " ")
                    .trim() ?? "",
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
                .replaceAll("Average:", "")
                .replaceAll(".", "")
                .trim(),
        );
        return {
            category: category,
            uploader: {
                name: uploaderName,
            },
            posted: posted,
            language: {
                text: languageRaw.split(" ")[0],
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
        const totalImages = Number(chapter?.additionalInfo?.pages ?? "0");
        if (totalImages === 0) return [];
        const IMAGES_PER_PAGE = 20;
        const totalPages = Math.ceil(totalImages / IMAGES_PER_PAGE);
        const pageUrls = Array.from(
            { length: totalPages },
            (_, page) =>
                `https://e-hentai.org/g/${chapter.chapterId}?p=${page}`,
        );
        const htmlPages = await Promise.all(
            pageUrls.map((url) => network.getChapterPages(url)),
        );
        const results: string[] = [];

        for (const html of htmlPages) {
            const $ = cheerio.load(html);
            $("a[href^='https://e-hentai.org/s/']").each((_, el) => {
                if (results.length >= totalImages) return;
                const url = $(el).attr("href");
                if (url) results.push(url);
            });
            if (results.length >= totalImages) break;
        }

        return results;
    }
}
