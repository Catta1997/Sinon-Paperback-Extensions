import {
  type ChapterPagesAPI,
  DOMAIN,
  type MangaChapterListAPI,
  type MangaInfoAPI,
  type MangaSectionAPI,
  type SearchInfoAPI,
} from "./models";
import {
  type Chapter,
  type ChapterDetails,
  ContentRating,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";
import {
  normalizeId,
  type MangaDotMetadata,
  getArrayArtists,
  getArrayAuthor,
  getArrayTitles, getDate,
} from "./utils";
import {MangaDot} from "./main";

export class Parser {
  parseMangaInfo(manga: MangaInfoAPI): SourceManga {
    const mangaInfo = manga.manga;
    return {
      mangaId: mangaInfo.id.toString(),
      mangaInfo: {
        thumbnailUrl: `${DOMAIN}${mangaInfo.photo}`,
        synopsis: mangaInfo.description,
        primaryTitle: mangaInfo.title,
        secondaryTitles: getArrayTitles(mangaInfo),
        contentRating:
          mangaInfo.is_adult || mangaInfo.is_hot ? ContentRating.ADULT : ContentRating.EVERYONE,
        status: mangaInfo.status,
        artist: getArrayArtists(mangaInfo),
        author: getArrayAuthor(mangaInfo),
        bannerUrl: `${DOMAIN}${mangaInfo.photo}`,
        rating: mangaInfo.avg_rating / 10,
        tagGroups: [
          {
            id: "genres",
            title: "Genres",
            tags: mangaInfo.genres.map((genre) => ({
              id: normalizeId(genre),
              title: genre,
            })),
          },
        ],
        shareUrl: mangaInfo.source_url,
      },
    };
  }
  parseChapters(chapterAPI: MangaChapterListAPI[], manga: SourceManga): Chapter[] {
    const chapters: Chapter[] = [];
    chapterAPI.filter((chapter) => {
      chapters.push({
        chapterId: chapter.id,
        sourceManga: manga,
        langCode: chapter.language,
        chapNum: Number(chapter.chapter_number) ?? 0,
        title: chapter.chapter_title,
        version: chapter.scanlator_name,
        volume: Number(chapter.volume_number) ?? 0,
        sortingIndex: Number(chapter.chapter_number) ?? 0,
        publishDate: getDate(chapter.date_added),
        creationDate: getDate(chapter.date_added),
      });
    });
    return chapters;
  }

  parseSearch(
    results: SearchInfoAPI,
    metadata: MangaDotMetadata | undefined,
  ): PagedResults<SearchResultItem> {
    const searchResults: SearchResultItem[] = [];
    const page = metadata?.page ?? 1;
    results.manga_list.forEach((result) => {
      searchResults.push({
        mangaId: result.id.toString(),
        title: result.title,
        subtitle: getArrayAuthor(result),
        imageUrl: `${DOMAIN}${result.photo}`,
        contentRating:
          result.is_hot || result.is_adult || result.is_blurworthy
            ? ContentRating.ADULT
            : ContentRating.EVERYONE,
      });
    });
    return {
      items: searchResults,
      metadata: searchResults.length > 0 ? { page: page + 1 } : undefined,
    };
  }

  parseChapterPages(pages: ChapterPagesAPI, chapter: Chapter): ChapterDetails {
    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages: pages.images.map((image) => `${DOMAIN}${image.url}`),
    };
  }

  parseSection(sectionElements: MangaSectionAPI): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.items.forEach((item) => {
      results.push({
        title: item.title,
        subtitle: `Chapter ${item.chapter_count}`,
        type: "simpleCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        contentRating: item.is_blurworthy ? ContentRating.ADULT : ContentRating.EVERYONE,
      });
    });
    return { items: results, metadata: undefined };
  }

  parseLatestSection(sectionElements: MangaSectionAPI): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.items.forEach((item) => {
      results.push({
        title: item.title,
        subtitle: `Chapter ${item.chapter_count}`,
        type: "chapterUpdatesCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        chapterId: "",
        publishDate: getDate(item.last_chapter_date),
        contentRating: item.is_blurworthy ? ContentRating.ADULT : ContentRating.EVERYONE,
      });
    });
    return { items: results, metadata: undefined };
  }
  parseProminentSection(sectionElements: MangaSectionAPI): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.items.forEach((item) => {
      results.push({
        title: item.title,
        subtitle: `Chapter ${item.chapter_count}`,
        type: "prominentCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        contentRating: item.is_blurworthy ? ContentRating.ADULT : ContentRating.EVERYONE,
      });
    });
    return { items: results, metadata: undefined };
  }
  parseFeaturedSection(sectionElements: MangaSectionAPI): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.items.forEach((item) => {
      results.push({
        title: item.title,
        supertitle: `Chapter ${item.chapter_count}`,
        type: "featuredCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        contentRating: item.is_blurworthy ? ContentRating.ADULT : ContentRating.EVERYONE,
      });
    });
    return { items: results, metadata: undefined };
  }
  async fixChapterPagesOnFail(chapter: string, mangaId: string): Promise<ChapterPagesAPI> {
    await Application.scheduleRequest({
      url: `https://mangadot.net/api/manga/${chapter}/view`,
      method: "POST"
    })
    await Application.scheduleRequest({
      url: `https://mangadot.net/api/manga/${chapter}/count`,
      method: "POST"
    })
    return await MangaDot.api.getJsonChapPagesApi(
        chapter,
        mangaId,
    );
  }
}
