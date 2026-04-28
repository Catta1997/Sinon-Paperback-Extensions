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
import type { ComicDetailResponse, ComicListItem, ComicsListResponse } from "./models";
import type { SearchMetadata } from "../EHentai/utils";

export class FansubGeneralParsers {
  async parseSearchResults(
    query: SearchQuery<SearchMetadata>,
    source: FansubGeneral,
  ): Promise<PagedResults<SearchResultItem>> {
    const jsonRequest = await source.requestManager.apiSearchResult(query);
    const json = JSON.parse(jsonRequest) as ComicsListResponse;
    const mangas: SearchResultItem[] = [];
    json.comics.forEach((comic: ComicListItem) => {
      mangas.push({
        mangaId: comic.slug,
        title: comic.title,
        imageUrl: comic.thumbnail,
        contentRating: comic.adult == 1 ? ContentRating.ADULT : ContentRating.EVERYONE,
      });
    });
    return {
      items: mangas,
    };
  }

  async parseMangaDetails(mangaid: string, source: FansubGeneral): Promise<SourceManga> {
    const jsonRequest = await source.requestManager.apiMangaDetails(mangaid);
    const json = JSON.parse(jsonRequest) as ComicDetailResponse;
    const comic = json.comic;
    const tags = comic.genres;
    const genres: Tag[] = tags.map((tag) => ({
      id: tag.slug,
      title: tag.name,
    }));
    const tagSection: TagSection[] = [{ id: "genres", title: "genres", tags: genres }];
    const info: MangaInfo = {
      thumbnailUrl: comic.thumbnail,
      synopsis: comic.description ?? "",
      primaryTitle: comic.title,
      secondaryTitles: comic.alt_titles,
      contentRating: comic.adult == 1 ? ContentRating.ADULT : ContentRating.EVERYONE,
      status: comic.status ?? "",
      artist: comic.artist ?? "",
      author: comic.author ?? "",
      rating: comic.rating / 10,
      tagGroups: tagSection,
    };
    return { mangaId: mangaid, mangaInfo: info };
  }

  async parseChapters(sourceManga: SourceManga, source: FansubGeneral): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    const jsonRequest = await source.requestManager.apiMangaDetails(sourceManga.mangaId);
    const json = JSON.parse(jsonRequest) as ComicDetailResponse;
    const comic = json.comic;
    comic.chapters.forEach((chapter) => {
      chapters.push({
        chapterId: chapter.url,
        sourceManga: sourceManga,
        langCode: chapter.language,
        chapNum: chapter.chapter ?? 0,
        title: chapter.title ?? chapter.full_title ?? "",
        version: chapter.teams[0]?.name ?? "",
        volume: chapter.volume ?? 0,
        publishDate: new Date(chapter.published_on),
      });
    });
    return chapters;
  }

  async parseSectionHome(
    source: FansubGeneral,
    section: DiscoverSection,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const _ = section;
    const jsonRequest = await source.requestManager.apiMangaDetails("", true);
    const json = JSON.parse(jsonRequest) as ComicsListResponse;
    const items: DiscoverSectionItem[] = json.comics.map((manga) => ({
      type: "chapterUpdatesCarouselItem",
      mangaId: manga.slug,
      chapterId: manga.last_chapter.url,
      imageUrl: manga.thumbnail,
      title: manga.title,
      subtitle: manga.last_chapter.title ?? manga.last_chapter.full_title,
      publishDate: new Date(manga.last_chapter.published_on),
      contentRating: manga.adult == 1 ? ContentRating.ADULT : ContentRating.EVERYONE,
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
