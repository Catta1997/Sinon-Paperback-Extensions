import {
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  ContentRating,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { NovelBuddyNetwork } from "./network";
import { NovelBuddyParser } from "./parser";
import type {
  ChapterItem,
  NovelBuddyMetadata,
  NovelBuddySearchMetadata,
  NovelItem,
} from "./models";
import NovelBuddyAdvancedSearchForm from "./search";
import { fetchGenres } from "./filters";

type NovelBuddyImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding;

export default class NovelBuddyExtension implements NovelBuddyImplementation {
  async initialise(): Promise<void> {}

  private parser = new NovelBuddyParser();
  private network = new NovelBuddyNetwork();
  async getAdvancedSearchForm(
    searchQuery: SearchQuery<NovelBuddySearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    await fetchGenres(this.network);
    return new NovelBuddyAdvancedSearchForm(searchQuery);
  }
  async getSearchResults(
    query: SearchQuery<NovelBuddySearchMetadata>,
    metadata: NovelBuddyMetadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    let results: SearchResultItem[] = [];
    const data = await this.network.search(page, query, sortingOption);
    results = data.data.items.map((item: NovelItem) => ({
      mangaId: item.url.replace(/^\//, ""),
      title: item.name,
      imageUrl: item.cover,
      contentRating: ContentRating.EVERYONE,
      mangaInfo: {
        primaryTitle: item.name,
        image: item.cover,
      },
    }));
    return {
      items: results,
      metadata: data.data.pagination.has_next ? { page: page + 1 } : undefined,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const html = await this.network.getNovel(mangaId);

    const data = this.parser.parseNextData(html);

    const manga = data.props.pageProps.initialManga;
    const tags = data.props.pageProps.initialManga.genres;
    return {
      mangaId: mangaId,
      mangaInfo: {
        additionalInfo: { id: manga.id },
        tagGroups: [
          {
            id: "genres",
            title: "Genres",
            tags: tags.map((tag) => ({
              title: tag.name,
              id: tag.slug,
            })),
          },
        ],
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
    console.log(sourceManga.mangaInfo.additionalInfo?.id);
    const id = sourceManga.mangaInfo.additionalInfo?.id ?? "";
    const chaptersRequest = await this.network.getChaptersList(id);
    const chapters = chaptersRequest.data?.chapters ?? [];
    return chapters
      .map((chapter: ChapterItem, index: number) => ({
        chapterId: chapter.id,
        sourceManga: sourceManga,
        langCode: "en",
        volume: 0,
        chapNum: chapters.length - index,
        additionalInfo: { url: chapter.url },
        title: chapter.name,
        publishDate: chapter.updated_at ? new Date(chapter.updated_at) : undefined,
      }))
      .reverse();
  }
  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "", label: "Default Order" },
      { id: "latest", label: "Latest Updates" },
      { id: "popular", label: "Most Popular" },
      { id: "rating", label: "Highest Rating" },
      { id: "views", label: "Most Viewed" },
      { id: "chapters", label: "Chapters" },
    ];
  }
  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const chapterData = await this.network.getChapterPages(chapter.additionalInfo?.url ?? "");

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      type: "html",
      html: `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${chapterData}</body></html>`,
    };
  }
}

export const NovelBuddy = new NovelBuddyExtension();
