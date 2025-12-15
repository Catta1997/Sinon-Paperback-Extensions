import {
  ContentRating,
  type MangaInfo,
  type SearchFilter,
  type Chapter,
  type ChapterDetails,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import type { Metadata } from "./models";
import { ApiMaker } from "./network";

const api = new ApiMaker();
export class JsonParser {
  async parseChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return [
      {
        chapterId: sourceManga.mangaId,
        sourceManga: sourceManga,
        langCode: "",
        chapNum: 1,
      },
    ];
  }

  async parseChapterDetails(chapterId: string): Promise<ChapterDetails> {
    const pages = await api.getJsonChapPagesApi(chapterId);
    const images: string[] = [];
    pages.images.forEach((image) => {
      images.push(image.source_url);
    });
    return {
      id: chapterId,
      mangaId: pages.comic.slug,
      pages: images,
    };
  }

  async parseMangaDetails(mangaId: string): Promise<SourceManga> {
    const manga = await api.getJsonMangaInfoApi(mangaId);
    const term_ids = manga.category;
    const genre_ids = manga.tags;
    const genreArray: Tag[] = genre_ids.map((genre) => ({
      id: genre.id.toString(),
      title: genre.name,
    }));
    const themeArray: Tag[] = [
      {
        id: term_ids.id.toString(),
        title: term_ids.name,
      },
    ];
    const tags: TagSection[] = [
      {
        title: "tags",
        tags: genreArray,
        id: "tags",
      },
      {
        title: "category",
        tags: themeArray,
        id: "category",
      },
    ];
    const mangaInfo: MangaInfo = {
      thumbnailUrl: manga.image_url ?? "",
      synopsis: "",
      primaryTitle: manga.title,
      secondaryTitles: [manga.alternative_title],
      contentRating: ContentRating.ADULT,
      bannerUrl: manga.image_url ?? "",
      tagGroups: tags,
    };
    return { mangaId: mangaId, mangaInfo: mangaInfo };
  }

  async parseSearchResults(
    query: SearchQuery,
    metadata: Metadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;

    const getFilterValue = (id: string) => query.filters.find((filter) => filter.id == id)?.value;
    const category: string | Record<string, "included" | "excluded"> =
      getFilterValue("category") ?? "";
    const language: string | Record<string, "included" | "excluded"> =
      getFilterValue("language") ?? "";
    const langFilter: string[] = [];
    const categoryFilter: string[] = [];
    if (category && typeof category === "object") {
      for (const tag of Object.entries(category)) {
        if (tag[1] == "included") categoryFilter.push(tag[0]);
      }
    }
    if (language && typeof language === "object") {
      for (const tag of Object.entries(language)) {
        if (tag[1] == "included") langFilter.push(tag[0]);
      }
    }
    const search = await api.getJsonSearchApi(query.title, page, langFilter, categoryFilter);
    const items: SearchResultItem[] = [];
    search.data.forEach((item) => {
      items.push({
        mangaId: item.slug,
        title: item.title,
        imageUrl: item.image_url ?? "",
        contentRating: ContentRating.ADULT,
      });
    });
    return {
      items: items,
      metadata: search.data.length > 0 ? { page: page + 1 } : undefined,
    };
  }
}

export class globalFilters {
  themes = [];

  async getFilters() {
    const filters: SearchFilter[] = [];
    const lang = await api.getJSONFilters("languages");
    const languages = lang.data.map((language) => ({
      id: language.id.toString(),
      value: language.name,
    }));
    const category = await api.getJSONFilters("categories");
    const categories = category.data.map((language) => ({
      id: language.id.toString(),
      value: language.name,
    }));
    filters.push({
      type: "multiselect",
      id: "language",
      title: "Language",
      options: languages,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: 1,
    });
    filters.push({
      type: "multiselect",
      id: "category",
      title: "Category",
      options: categories,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: 1,
    });
    return filters;
  }
}
