import {
  ContentRating,
  type MangaInfo,
  type Chapter,
  type ChapterDetails,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
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

  async parseSearchResults(query: SearchQuery<{}>): Promise<PagedResults<SearchResultItem>> {
    const search = await api.getJsonSearchApi(query.title, 1, [], []);
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
      metadata: undefined,
    };
  }
}
