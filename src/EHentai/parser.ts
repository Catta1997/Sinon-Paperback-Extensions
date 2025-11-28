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
        /*
        const first = await Application.scheduleRequest(
            {
            url:`https://e-hentai.org/g/${chapterId}`,
                method: "GET"
            }
        )
        const html = Application.arrayBufferToUTF8String(first[1])
        const firstParse = cheerio.load(html);
        const element = firstParse("#gdt a").first();
        let currentUrl = element.attr("href") || "";
        console.log(currentUrl);
        const images: string[] = [];
        while (true) {
            const html = await network.getChapterPages(currentUrl);
            const $ = cheerio.load(html);
            const div = $("#i3");
            const imgUrl = div.find("img#img").attr("src");
            if (imgUrl) images.push(imgUrl);
            let nextUrl = div.find("a[href*='/s/']").attr("href");
            if (nextUrl && !nextUrl.startsWith("http"))
                nextUrl = "https://e-hentai.org" + nextUrl;
            console.log(nextUrl);
            console.log(currentUrl);
            if (!nextUrl || nextUrl === currentUrl) break;
            currentUrl = nextUrl;
        }
        */
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
        //  console.log(results.join("££"));
        return results;
    }
}
/*

https://nkjnbky.mgotlvykuirf.hath.network/
h/3df60405c8cf9f9d901688970e008544dd5e5d3f-182404-1280-1869-wbp/
keystamp=1764353400-9e145d5e55;fileindex=207683639;xres=1280/1_1.webp


https://pdaziik.khqevofziobw.hath.network:15255
/h/0575369ce9b9a33729d79d8c49eed9a99de93b28-153132-1280-1869-wbp/keystamp=1764353400-4c58897e51;fileindex=207683640;xres=1280/1_10.webp

Kingfisher.KingfisherError.processorError(reason: Kingfisher.KingfisherError.ProcessorErrorReason.processingFailed(processor:
KingfisherWebP.WebPProcessor(identifier: "com.yeatse.WebPProcessor"), item: Kingfisher.ImageProcessItem.data(5199 bytes)))
 */
