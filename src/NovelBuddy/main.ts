import {
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  ContentRating,
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  type ExtensionImpl,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import type basePbConfig from "./pbconfig";
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

export class NovelBuddyExtension implements ExtensionImpl<typeof basePbConfig> {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "trending",
        title: "Trending Today",
        subtitle: "",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: "trending_week",
        title: "Trending This Week",
        subtitle: "",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "popular_today",
        title: "Popular Updates Today",
        subtitle: "",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "popular_week",
        title: "Popular Updates This Week",
        subtitle: "",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "latest",
        title: "Latest Updates",
        subtitle: "",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "new",
        title: "New Manga",
        subtitle: "",
        type: DiscoverSectionType.simpleCarousel,
      },
    ];
  }
  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: NovelBuddyMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    switch (section.id) {
      case "trending":
        return this.network.parsePopular("today");
      case "trending_week":
        return this.trendingAsSimple(await this.network.parsePopular("week"));
      case "popular_today":
        return this.network.parseList("bookmarks", page, "today");
      case "popular_week":
        return this.network.parseList("bookmarks", page, "week");
      case "latest":
        return this.network.parseList("latest", page);
      case "new":
        return this.network.parseList("newest", page);
      default:
        return { items: [] };
    }
  }

  /** Trending This Week shows as a regular row, so its items need the regular row type. */
  private trendingAsSimple(
    results: PagedResults<DiscoverSectionItem>,
  ): PagedResults<DiscoverSectionItem> {
    return {
      items: results.items.map((item) =>
        item.type === "featuredCarouselItem"
          ? {
              type: "simpleCarouselItem",
              mangaId: item.mangaId,
              imageUrl: item.imageUrl,
              title: item.title,
              contentRating: item.contentRating,
            }
          : item,
      ),
    };
  }
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
        additionalInfo: { id: manga.id, cv: manga.cv.toString() },
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
    const id = sourceManga.mangaInfo.additionalInfo?.id ?? "";
    const cv = sourceManga.mangaInfo.additionalInfo?.cv ?? "";
    const chaptersRequest = await this.network.getChaptersList(id, cv);
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
