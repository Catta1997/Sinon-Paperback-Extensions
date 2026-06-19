import {
  type Chapter,
  type ChapterDetails,
  ContentRating,
  type DiscoverSectionItem,
  type MangaInfo,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import { OmegaScansAPI } from "./network";
import type { OmegaScansMetadata, OmegaScansSearchMetadata } from "./model";
import { fixVoidElements } from "../novelUtils";
import { decodeHTML } from "entities";
import { genres } from "./filters";

export class JsonParser {
  api = new OmegaScansAPI();

  async parseMangaInfo(mangaId: string): Promise<SourceManga> {
    const manga = await this.api.getMangaInfo(mangaId);
    const info: MangaInfo = {
      thumbnailUrl: manga.thumbnail,
      synopsis: decodeHTML(manga.description).replace(/<[^>]*>/g, ""),
      primaryTitle: manga.title,
      secondaryTitles: [manga.alternative_names],
      contentRating: ContentRating.ADULT,
      contentType: manga.series_type === "Comic" ? "comic" : "novel",
      status: manga.status,
      artist: manga.studio,
      author: manga.author,
      rating: manga.rating / 5,
      additionalInfo: { id: manga.id.toString() },
      tagGroups: [
        {
          id: "genres",
          title: "genres",
          tags: manga.tags.map((tag) => ({
            title: tag.name,
            id: tag.id.toString(),
          })),
        },
      ],
    };
    return {
      mangaId: mangaId,
      mangaInfo: info,
    };
  }

  async getSections(
    serisType: string,
    order: string,
    metadata: OmegaScansMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const section = await this.api.getDiscovery(serisType, page, order);
    const sections: DiscoverSectionItem[] = section.data.map((element) => ({
      type: "featuredCarouselItem",
      mangaId: `${element.series_slug}`,
      imageUrl: element.thumbnail,
      title: element.title,
      infoItems: [
        { symbol: "star.fill", text: (Math.round((element.rating ?? 0) * 100) / 100 *2).toString() },
        { symbol: "book.fill", text: element.status?.toString() ?? "" },
      ],
      summary: decodeHTML(element.description).replace(/<[^>]*>/g, ""),
      ContentRating: ContentRating.ADULT,
    }));
    return {
      items: sections,
      metadata: section.meta.last_page > page ? { page: page + 1 } : undefined,
    };
  }

  async getTrendingSections(serisType: string): Promise<PagedResults<DiscoverSectionItem>> {
    const section = await this.api.getTrending(serisType);
    const sections: DiscoverSectionItem[] = section.map((element) => ({
      type: "prominentCarouselItem",
      mangaId: `${element.series_slug}`,
      imageUrl: element.thumbnail,
      title: element.title,
      summary: decodeHTML(element.description).replace(/<[^>]*>/g, ""),
      ContentRating: ContentRating.ADULT,
    }));
    return { items: sections };
  }

  async getGenresSections(): Promise<PagedResults<DiscoverSectionItem>> {
    const sections: DiscoverSectionItem[] = genres.map((genre) => ({
      type: "genresCarouselItem",
      name: genre.title,
      searchQuery: {
        title: "",
        metadata: { tags_ids: [genre.id] },
      },
      ContentRating: ContentRating.ADULT,
    }));
    return { items: sections };
  }

  async getChapterList(sourceManga: SourceManga): Promise<Chapter[]> {
    const chapters = await this.api.getChaptersList(
      sourceManga.mangaInfo.additionalInfo?.id ?? "",
      1,
    );
    const chapterList: Chapter[] = [];
    chapters.data.forEach((chapter, index) => {
      if (chapter.price === 0) {
        const number = Number(chapter.chapter_name.split(" ")[1]);
        chapterList.push({
          chapterId: chapter.chapter_slug,
          chapNum: Number.isNaN(number) ? index : number,
          volume: 0,
          sortingIndex: Number.isNaN(number) ? index : number,
          title: chapter.chapter_title,
          langCode: "en",
          creationDate: new Date(chapter.created_at),
          publishDate: new Date(chapter.created_at),
          sourceManga: sourceManga,
        });
      }
    });
    return chapterList;
  }

  async getNovel(mangaSlug: string, chapterSlug: string): Promise<ChapterDetails> {
    const novelHtml = (await this.api.getNovel(mangaSlug, chapterSlug)).chapter.chapter_content;
    const contentDiv = fixVoidElements(novelHtml)
      .replaceAll(/\u00a0/g, " ")
      .replaceAll("&nbsp;", " ");
    return {
      type: "html",
      id: chapterSlug,
      mangaId: mangaSlug,
      html: `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${contentDiv}</body></html>`,
    };
  }
  async getMangaPages(mangaSlug: string, chapterSlug: string): Promise<ChapterDetails> {
    const manga = await this.api.getMangaPages(mangaSlug, chapterSlug);
    return {
      id: chapterSlug,
      mangaId: mangaSlug,
      pages: manga.chapter.chapter_data.images,
    };
  }

  async getSearchResult(
    query: SearchQuery<OmegaScansSearchMetadata>,
    metadata: OmegaScansMetadata,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const manga = await this.api.getSearchResult(query, page, sortingOption);
    return {
      items: manga.data.map((item) => ({
        mangaId: item.series_slug,
        title: item.title,
        subtitle: `★ ${(Math.round((item.rating ?? 0) * 100) / 100) *2}`,
        imageUrl: item.thumbnail,
        contentRating: ContentRating.ADULT,
      })),
      metadata: manga.meta.last_page > page ? { page: page + 1 } : undefined,
    };
  }
}
