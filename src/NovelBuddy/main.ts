import {
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  ContentRating,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  DiscoverSectionType,
  type Extension,
  type MangaProviding,
  type Metadata,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SourceManga,
} from "@paperback/types";

import { NovelBuddyNetwork } from "./network";
import { NovelBuddyParser } from "./parser";
import type {ChapterList, NovelItem} from "./models";

type NovelBuddyImplementation = DiscoverSectionProviding &
  Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding;

export default class NovelBuddyExtension implements NovelBuddyImplementation {
  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const data = await this.network.search(1);
	return {items:[]}
  }
  async initialise(): Promise<void> {
    //throw new Error("Method not implemented.");
  }

  private parser = new NovelBuddyParser();
  private network = new NovelBuddyNetwork();

  async getSearchResults(
    query: SearchQuery<{}>,
    metadata?: undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata ?? 1;
    const data = await this.network.search(page, query.title);
    const results: SearchResultItem[] = data.data.items.map((item: NovelItem) => ({
      mangaId: item.url.replace(/^\//, ""),
      title: item.name,
      imageUrl: item.cover,
      mangaInfo: {
        primaryTitle: item.name,
        image: item.cover,
      },
    }));
    return {
      items: results,
      metadata: page + 1,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const html = await this.network.getNovel(mangaId);

    const data = this.parser.parseNextData(html);

    const manga = data.props.pageProps.initialManga;

    return {
      mangaId: mangaId,
      mangaInfo: {
        primaryTitle: manga.name,
        thumbnailUrl: manga.cover,
        contentType: "novel",
        author: manga.authors?.map((a) => a.name).join(", "),
        artist: manga.artists?.map((a) => a.name).join(", "),
        synopsis: this.parser.parseDescription(manga.summary),
        secondaryTitles: [],
        contentRating: ContentRating.EVERYONE,
      },
    };
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const html = await this.network.getNovel(sourceManga.mangaId);

    const data = this.parser.parseNextData(html);

    const chapters = data.props.pageProps.initialManga.chapters;

    return chapters.map((chapter: ChapterList) => ({
        chapterId: chapter.id,
        sourceManga: sourceManga,
        langCode: "en",
        chapNum: 0,
      additionalInfo: {slug: chapter.slug},
        title: chapter.name,
        publishDate: chapter.updatedAt ? new Date(chapter.updatedAt) : undefined,
      }))
      .reverse();
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const html = await this.network.getNovel(chapter.sourceManga.mangaId);
    const data = this.parser.parseNextData(html);
    const manga = data.props.pageProps.initialManga;
    const chapterData = await this.network.getChapterPages(manga.slug, chapter.additionalInfo?.slug ?? "");

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      type: "html",
      html: `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${chapterData}</body></html>`
    };
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "popular",
        title: "Popular",
        type: DiscoverSectionType.simpleCarousel,
      },
    ];
  }
}

export const NovelBuddy = new NovelBuddyExtension();