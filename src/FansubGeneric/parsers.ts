import {
  type Chapter,
  type ChapterDetails,
  ContentRating,
  type DiscoverSection,
  type DiscoverSectionItem,
  type MangaInfo,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import FansubGeneral from "./main";
import type { BaseMetadata, ComicListItem } from "./models";

const toContentRating = (adult: number) =>
  adult == 1 ? ContentRating.ADULT : ContentRating.EVERYONE;

export class FansubGeneralParsers {
  async parseSearchResults(
    query: SearchQuery<BaseMetadata>,
    source: FansubGeneral,
  ): Promise<PagedResults<SearchResultItem>> {
    const json = await source.requestManager.apiSearchResult(query);
    return {
      items: json.comics.map((comic: ComicListItem) => ({
        mangaId: comic.slug,
        title: comic.title,
        imageUrl: comic.thumbnail,
        contentRating: toContentRating(comic.adult),
      })),
    };
  }

  async parseMangaDetails(mangaid: string, source: FansubGeneral): Promise<SourceManga> {
    const { comic } = await source.requestManager.apiMangaDetails(mangaid);
    const genres: Tag[] = comic.genres.map((tag) => ({
      id: tag.slug,
      title: tag.name,
    }));
    const tagSection: TagSection[] = [{ id: "genres", title: "genres", tags: genres }];
    const info: MangaInfo = {
      thumbnailUrl: comic.thumbnail,
      synopsis: comic.description ?? "",
      primaryTitle: comic.title,
      secondaryTitles: comic.alt_titles,
      contentRating: toContentRating(comic.adult),
      status: comic.status ?? "",
      artist: comic.artist ?? "",
      author: comic.author ?? "",
      rating: comic.rating / 10,
      tagGroups: tagSection,
    };
    return { mangaId: mangaid, mangaInfo: info };
  }

  async parseChapters(sourceManga: SourceManga, source: FansubGeneral): Promise<Chapter[]> {
    const { comic } = await source.requestManager.apiMangaDetails(sourceManga.mangaId);
    return comic.chapters.map((chapter) => ({
      chapterId: chapter.url,
      sourceManga: sourceManga,
      langCode: chapter.language,
      chapNum: chapter.chapter ?? 0,
      title: chapter.title ?? chapter.full_title ?? "",
      version: chapter.teams[0]?.name ?? "",
      volume: chapter.volume ?? 0,
      publishDate: new Date(chapter.published_on),
    }));
  }

  async parseSectionHome(
    source: FansubGeneral,
    _section: DiscoverSection,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const json = await source.requestManager.apiLatestComics();
    const items: DiscoverSectionItem[] = json.comics.map((manga) => ({
      type: "chapterUpdatesCarouselItem",
      mangaId: manga.slug,
      chapterId: manga.last_chapter.url,
      imageUrl: manga.thumbnail,
      title: manga.title,
      subtitle: manga.last_chapter.title ?? manga.last_chapter.full_title,
      publishDate: new Date(manga.last_chapter.published_on),
      contentRating: toContentRating(manga.adult),
    }));
    return { items: items };
  }

  async parseChapterDetails(chapter: Chapter, source: FansubGeneral): Promise<ChapterDetails> {
    const pages = await source.requestManager.getChapterPages(chapter.chapterId);
    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages: pages,
    };
  }
}
