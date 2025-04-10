import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    ContentRating,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionType,
    Extension,
    MangaProviding,
    PagedResults,
    PaperbackInterceptor,
    Request,
    Response,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";

type Metadata = {
    page?: number;
};
// Should match the capabilities which you defined in pbconfig.ts
type ContentTemplateImplementation = Extension &
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
export class ScansExtension implements ContentTemplateImplementation {
    // Implementation of the main rate limiter
    mainRateLimiter = new BasicRateLimiter("main", {
        numberOfRequests: 15,
        bufferInterval: 10,
        ignoreImages: true,
    });
    RETRIES = 10;

    // Implementation of the main interceptor
    mainInterceptor = new MainInterceptor("main");

    // Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const data = (
            await Application.scheduleRequest({
                url: `https://${mangaId}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        const image = $(".left-column img").attr("data-lazy-src");
        console.log(image);
        const title = $(".left-column img").attr("alt");
        const elems = $(".wp-block-list li").toArray();
        const trama = $(elems[0]).text();
        const altTitle = $(elems[1])
            .text()
            .split("Alternate Name(s):")[1]
            .replace(" ", "")
            .split(",");
        const author = $(elems[2]).text().split("Author(s):")[1].trim();
        const genres = $(elems[3])
            .text()
            .split("Genre(s):")[1]
            .trimStart()
            .trimEnd()
            .replaceAll(" ", "")
            .split(",");
        console.log(genres.join(", "));
        const arrayTags: Tag[] = [];
        for (const tag of genres) {
            arrayTags.push({
                title: tag,
                id: tag.replace("  ", "").replace(" ", "-"),
            });
        }
        const tagSections: TagSection[] = [
            { id: "genres", title: "genres", tags: arrayTags },
        ];
        return {
            mangaId: mangaId,
            mangaInfo: {
                tagGroups: tagSections,
                author: author ?? "",
                thumbnailUrl: image ?? "",
                synopsis: trama,
                primaryTitle: title ?? "",
                secondaryTitles: altTitle,
                contentRating: ContentRating.EVERYONE,
            },
        };
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const data = (
            await Application.scheduleRequest({
                url: `https://${chapter.sourceManga.mangaId}manga/${chapter.chapterId}`,
                method: "GET",
            })
        )[1];
        //
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        const pages: string[] = [];
        for (const item of $(".separator img").toArray()) {
            console.log(item);
            const imageUrl = $(item).attr("data-lazy-src");
            console.log(imageUrl);
            if (!imageUrl) continue;
            if (!imageUrl.includes("chapter-")) continue;
            pages.push(imageUrl.trim());
        }
        return {
            id: chapter.chapterId,
            mangaId: chapter.sourceManga.mangaId,
            pages: pages,
        };
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const data = (
            await Application.scheduleRequest({
                url: `https://${sourceManga.mangaId}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        const chapters: Chapter[] = [];
        const arrChapters = $("li.item").toArray().reverse();
        for (const item of arrChapters) {
            const chapterId = $("a", item).attr("href") ?? "";
            console.log("ID " + chapterId);
            const chapN = $(item).closest(".item").attr("data-number"); //chapterId.match(/chapter-([0-9]+)\//)?.[1] ?? "";
            console.log("Capitolo " + chapN);
            // trasformo in Number capitolo e volume
            const chapNum = isNaN(Number(chapN)) ? 1 : Number(chapN);
            const date = $("span.chapter-date", item).text();
            const dataVar: string[] = date.split(" ");
            const num = Number(dataVar[0]);
            const oggi = new Date();
            if (date.includes("year")) {
                oggi.setFullYear(oggi.getFullYear() - num);
            }
            if (date.includes("month")) {
                oggi.setMonth(oggi.getMonth() - num);
            }
            if (date.includes("week")) {
                oggi.setDate(oggi.getDate() - num * 7);
            }
            if (date.includes("day")) {
                oggi.setDate(oggi.getDate() - num);
            }
            console.log("Data " + oggi.toDateString());
            console.log("Capitolo Num " + chapNum);
            chapters.push({
                chapterId: chapterId.match(/manga\/((.)*\/)/)?.[1] ?? "", //`89400-kaoru-hana-wa-rin-to-saku-chapter-${chapNum}`,
                sourceManga: sourceManga,
                langCode: "en",
                chapNum: chapNum,
                title: `${chapNum}`,
                publishDate: oggi,
            });
        }
        return chapters;
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const latest: DiscoverSectionItem[] = [];
        if (section.id === "mese_section") {
            latest.push({
                metadata: metadata,
                type: "simpleCarouselItem",
                imageUrl:
                    "https://kaoruhanawarintosaku.com/wp-content/uploads/2024/04/Kaoru-Hana-wa-Rin-to-Saku.webp",
                mangaId: "kaoruhanawarintosaku.com/",
                title: "Kaoru Hana wa Rin to Saku",
            });
            latest.push({
                metadata: metadata,
                type: "simpleCarouselItem",
                imageUrl:
                    "https://gimaiseikatsu.site/wp-content/uploads/2024/03/Gimai-Seikatsu-cover.webp",
                mangaId: "gimaiseikatsu.site/",
                title: "Gimai Seikatsu",
            });
        }
        return { items: latest, metadata: metadata };
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "mese_section",
                title: "Manga",
                type: DiscoverSectionType.prominentCarousel,
            },
        ];
    }
}

export const DevTestExtension = new ScansExtension();
