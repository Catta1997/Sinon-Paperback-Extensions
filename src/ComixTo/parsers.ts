import {
    ContentRating,
    type Chapter,
    type ChapterDetails,
    type DiscoverSectionItem,
    type PagedResults,
    type SearchQuery,
    type SearchResultItem,
    type SortingOption,
    type SourceManga,
    type Tag,
    type TagSection,
} from "@paperback/types";
import { filter } from "./main";
import type { ChapterItem, Metadata } from "./models";
import { ApiMaker } from "./network";

const api = new ApiMaker();
export class JsonParser {
    async parseSectionRecent(section: string, metadata: Metadata) {
        const latest: DiscoverSectionItem[] = [];
        const page = metadata?.page ?? 1;
        const json = await api.getJsonMangaApi(section, page);
        if (json.status === 200) {
            for (const item of json.result.items) {
                latest.push({
                    type: "simpleCarouselItem",
                    contentRating: item.is_nsfw
                        ? ContentRating.ADULT
                        : ContentRating.EVERYONE,
                    imageUrl:
                        item.poster.large.length > 0
                            ? item.poster.large
                            : "https://comix.to/images/no-poster.png",
                    mangaId: item.hash_id,
                    title: item.title,
                    subtitle: item.author?.[0]?.title ?? "",
                });
            }
        }
        return {
            items: latest,
            metadata: { page: page + 1 },
        };
    }

    async parseSectionFollow(section: string) {
        const latest: DiscoverSectionItem[] = [];
        const json = await api.getJsonMangaApi(section, 1);
        if (json.status === 200) {
            for (const item of json.result.items) {
                latest.push({
                    type: "prominentCarouselItem",
                    contentRating: item.is_nsfw
                        ? ContentRating.ADULT
                        : ContentRating.EVERYONE,
                    imageUrl:
                        item.poster.large.length > 0
                            ? item.poster.large
                            : "https://comix.to/images/no-poster.png",
                    mangaId: item.hash_id,
                    title: item.title,
                    subtitle: item.author?.[0]?.title ?? "",
                });
            }
        }
        return {
            items: latest,
            metadata: undefined,
        };
    }

    async parseSectionPopular(section: string) {
        const latest: DiscoverSectionItem[] = [];
        const json = await api.getJsonMangaApi(section, 1);
        if (json.status === 200) {
            for (const item of json.result.items) {
                latest.push({
                    type: "featuredCarouselItem",
                    contentRating: item.is_nsfw
                        ? ContentRating.ADULT
                        : ContentRating.EVERYONE,
                    imageUrl:
                        item.poster.large.length > 0
                            ? item.poster.large
                            : "https://comix.to/images/no-poster.png",
                    mangaId: item.hash_id,
                    title: item.title,
                    supertitle: item.author?.[0]?.title ?? "",
                });
            }
        }
        return {
            items: latest,
            metadata: undefined,
        };
    }

    async parseSectionChUp(section: string, metadata: Metadata) {
        const latest: DiscoverSectionItem[] = [];
        const page = metadata?.page ?? 1;
        const json = await api.getJsonMangaApi(section, page);
        if (json.status === 200) {
            json.result.items.forEach((item) => {
                latest.push({
                    contentRating: item.is_nsfw
                        ? ContentRating.ADULT
                        : ContentRating.EVERYONE,
                    imageUrl:
                        item.poster.large.length > 0
                            ? item.poster.large
                            : "https://comix.to/images/no-poster.png",
                    chapterId: item.hash_id,
                    mangaId: item.hash_id,
                    subtitle: "Chapter " + item.latest_chapter.toString(),
                    title: item.title,
                    type: "chapterUpdatesCarouselItem",
                    publishDate: new Date(item.chapter_updated_at * 1000),
                });
            });
            return {
                items: latest,
                metadata:
                    json.result.items.length > 0
                        ? { page: page + 1 }
                        : undefined,
            };
        }
        return { items: latest, metadata: undefined };
    }

    async parseChapters(manga: SourceManga): Promise<Chapter[]> {
        let chaptersArray: ChapterItem[] = [];
        let page = 1;
        let newPage = true;
        do {
            const chapters = await api.getJsonChapterApi(manga.mangaId, page);
            page++;
            chaptersArray = [...chaptersArray, ...chapters.result.items];
            if (chapters.result.items.length == 0) newPage = false;
        } while (newPage);
        const chapterList: Chapter[] = [];
        chaptersArray.forEach((chapter) => {
            chapterList.push({
                chapterId: chapter.chapter_id.toString(),
                sourceManga: manga,
                langCode: chapter.language,
                chapNum: chapter.number,
                title: chapter.name,
                version: chapter.scanlation_group?.name ?? "",
                volume: chapter.volume,
                publishDate: new Date(chapter.updated_at * 1000),
                creationDate: new Date(chapter.created_at * 1000),
            });
        });
        return chapterList;
    }

    async parseChapterDetails(chapterId: string): Promise<ChapterDetails> {
        const pages = await api.getJsonChapPagesApi(chapterId);
        return {
            id: chapterId,
            mangaId: pages.result.manga_id.toString(),
            pages: pages.result.images,
        };
    }

    async parseMangaDetails(mangaId: string): Promise<SourceManga> {
        const info = await api.getJsonMangaInfoApi(mangaId);
        const manga = info.result;
        const term_ids = manga.term_ids;
        const genT = filter.genres.filter((i) =>
            term_ids.includes(Number(i.id)),
        );
        const tagsArray: Tag[] = genT.map((genre) => ({
            id: genre.id,
            title: genre.value,
        }));
        const tags: TagSection[] = [
            {
                title: "genres",
                tags: tagsArray,
                id: "genres",
            },
        ];
        const mangaInfo = {
            thumbnailUrl:
                manga.poster.large.length > 0
                    ? manga.poster.large
                    : "https://comix.to/images/no-poster.png",
            synopsis: manga.synopsis,
            primaryTitle: manga.title,
            secondaryTitles: manga.alt_titles,
            contentRating: manga.is_nsfw
                ? ContentRating.ADULT
                : ContentRating.EVERYONE,
            status: manga.status,
            bannerUrl:
                manga.poster.medium.length > 0
                    ? manga.poster.medium
                    : "https://comix.to/images/no-poster.png",
            artist: manga.artist?.[0]?.title ?? "",
            author: manga.author?.[0]?.title ?? "",
            rating: manga.rated_avg / 10,
            tagGroups: tags,
            shareUrl: `https://comix.to/title/${manga.hash_id}`,
        };
        return { mangaId: mangaId, mangaInfo: mangaInfo };
    }

    async parseSearchResults(
        query: SearchQuery,
        metadata: Metadata | undefined,
        sortingOption: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;

        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        const genres: string | Record<string, "included" | "excluded"> =
            getFilterValue("genres") ?? "";
        const types: string | Record<string, "included" | "excluded"> =
            getFilterValue("types") ?? "";
        const demographic: string | Record<string, "included" | "excluded"> =
            getFilterValue("demographic") ?? "";
        const status: string | Record<string, "included" | "excluded"> =
            getFilterValue("status") ?? "";
        const genresFilter: string[] = [];
        const typeFilter: string[] = [];
        const demogFilter: string[] = [];
        const stutusFilter: string[] = [];
        if (genres && typeof genres === "object") {
            for (const tag of Object.entries(genres)) {
                if (tag[1] == "included") genresFilter.push(tag[0]);
                if (tag[1] == "excluded") genresFilter.push("-" + tag[0]);
            }
        }
        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                if (tag[1] == "included") typeFilter.push(tag[0]);
            }
        }
        if (demographic && typeof demographic === "object") {
            for (const tag of Object.entries(demographic)) {
                if (tag[1] == "included") demogFilter.push(tag[0]);
            }
        }
        if (status && typeof status === "object") {
            for (const tag of Object.entries(status)) {
                if (tag[1] == "included") stutusFilter.push(tag[0]);
            }
        }
        const [sortBy, orderBy] = sortingOption.id.split("$");
        const search = await api.getJsonSearchApi(
            query.title,
            page,
            genresFilter,
            typeFilter,
            demogFilter,
            stutusFilter,
            sortBy,
            orderBy,
        );
        const items: SearchResultItem[] = [];
        if (search.status === 200) {
            search.result.items.forEach((item) => {
                items.push({
                    mangaId: item.hash_id,
                    title: item.title,
                    imageUrl:
                        item.poster.large.length > 0
                            ? item.poster.large
                            : "https://comix.to/images/no-poster.png",
                    contentRating: item.is_nsfw
                        ? ContentRating.ADULT
                        : ContentRating.EVERYONE,
                });
            });
            return {
                items: items,
                metadata:
                    search.result.items.length > 0
                        ? { page: page + 1 }
                        : undefined,
            };
        }
        return {
            items: items,
            metadata: undefined,
        };
    }
}
