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
import { normalizeId, type MangaDotMetadata } from "./utils";

export class Parser {
  parseMangaInfo(manga: MangaInfoAPI): SourceManga {
    const mangaInfo = manga.manga;
    return {
      mangaId: mangaInfo.id.toString(),
      mangaInfo: {
        thumbnailUrl: `${DOMAIN}${mangaInfo.photo}`,
        synopsis: mangaInfo.description,
        primaryTitle: mangaInfo.title,
        secondaryTitles: mangaInfo.alt_titles,
        contentRating:
          mangaInfo.is_adult || mangaInfo.is_hot ? ContentRating.ADULT : ContentRating.EVERYONE,
        status: mangaInfo.status,
        artist: Array.isArray(mangaInfo.artists) ? mangaInfo.artists.join(",") : mangaInfo.artists,
        author: Array.isArray(mangaInfo.authors) ? mangaInfo.authors.join(",") : mangaInfo.authors,
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
        subtitle: Array.isArray(result.authors) ? result.authors.join(",") : result.authors,
        imageUrl: `${DOMAIN}${result.photo}`,
        contentRating:
          result.is_hot || result.is_adult ? ContentRating.ADULT : ContentRating.EVERYONE,
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
        type: "simpleCarouselItem",
        mangaId: item.id.toString(),
        imageUrl: `${DOMAIN}${item.photo}`,
        title: item.title,
        subtitle: item.status,
        contentRating: item.is_blurworthy ? ContentRating.MATURE : ContentRating.EVERYONE,
      });
    });
    return { items: results, metadata: undefined };
  }
}

/*


const sections: TagSection[] = [
  {
    id: "genres",
    title: "Genres",
    tags: genres.map(genre => ({
      id: genre,
      title: genre
    }))
  }
]

 */
