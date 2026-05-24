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
  type ChapterPagesAPI,
  DOMAIN,
  type MangaChapterListAPI,
  type MangaInfoAPI,
  type SearchInfoAPI,
} from "./models";
import {
  normalizeId,
  type MangaDotMetadata,
  getArrayArtists,
  getArrayAuthor,
  getArrayTitles,
  getDate,
  getRating,
} from "./utils";

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
        contentRating: mangaInfo.is_adult ? ContentRating.ADULT : ContentRating.EVERYONE,
        status: mangaInfo.status,
        artist: getArrayArtists(mangaInfo),
        author: getArrayAuthor(mangaInfo),
        bannerUrl: `${DOMAIN}${mangaInfo.banner_image}`,
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
        shareUrl: `${DOMAIN}/manga/${mangaInfo.id}`,
      },
    };
  }
  parseChapters(chapterAPI: MangaChapterListAPI[], manga: SourceManga): Chapter[] {
    return chapterAPI.map((chapter) => {
      return {
        chapterId: chapter.id.toString(),
        sourceManga: manga,
        langCode: chapter.language,
        chapNum: chapter.chapter_number ?? 0,
        title: chapter.chapter_title,
        version: chapter.scanlator_name,
        volume: chapter.volume_number ?? 0,
        sortingIndex: chapter.chapter_number ?? 0,
        publishDate: getDate(chapter.date_added),
        creationDate: getDate(chapter.date_added),
        additionalInfo: { upload: chapter.uploader_upload_status?.toString() ?? "" },
      };
    });
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
        contentRating: getRating(result),
      });
    });
    return {
      items: searchResults,
      metadata: results.pagination.total_pages > page ? { page: page + 1 } : undefined,
    };
  }

  parseChapterPages(pages: ChapterPagesAPI, chapter: Chapter): ChapterDetails {
    if (!pages?.images || !Array.isArray(pages.images)) {
      throw new Error("pages.images doesn't exist");
    }
    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages: pages.images.map((image) => `${DOMAIN}${image.url}`),
    };
  }

  parseSection(sectionElements: SearchInfoAPI, page: number): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.manga_list.forEach((item) => {
      results.push({
        title: item.title,
        subtitle: getArrayAuthor(item),
        type: "simpleCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        contentRating: getRating(item),
      });
    });
    return {
      items: results,
      metadata: sectionElements.pagination.total_pages > page ? { page: page + 1 } : undefined,
    };
  }

  parseLatestSection(
    sectionElements: SearchInfoAPI,
    page: number,
  ): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.manga_list.forEach((item) => {
      results.push({
        title: item.title,
        subtitle: `Chapter ${item.chapter_count}`,
        type: "chapterUpdatesCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        chapterId: "",
        publishDate: getDate(item.last_chapter_date),
        contentRating: getRating(item),
      });
    });
    return {
      items: results,
      metadata: sectionElements.pagination.total_pages > page ? { page: page + 1 } : undefined,
    };
  }

  parseProminentSection(
    sectionElements: SearchInfoAPI,
    page: number,
  ): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.manga_list.forEach((item) => {
      results.push({
        title: item.title,
        subtitle: getArrayAuthor(item),
        type: "prominentCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        contentRating: getRating(item),
      });
    });
    return {
      items: results,
      metadata: sectionElements.pagination.total_pages > page ? { page: page + 1 } : undefined,
    };
  }

  parseFeaturedSection(
    sectionElements: SearchInfoAPI,
    page: number,
  ): PagedResults<DiscoverSectionItem> {
    const results: DiscoverSectionItem[] = [];
    sectionElements.manga_list.forEach((item) => {
      results.push({
        title: item.title,
        supertitle: getArrayAuthor(item),
        type: "featuredCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        contentRating: getRating(item),
      });
    });
    return {
      items: results,
      metadata: sectionElements.pagination.total_pages > page ? { page: page + 1 } : undefined,
    };
  }
}
