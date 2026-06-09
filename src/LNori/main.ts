import { MainInterceptor, mainRateLimiter, parseHTML } from "./network";
import {
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
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
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import { LNoriParser } from "./parser";
import { DOMAIN } from "./utils";

type LNoriImplementation = DiscoverSectionProviding &
  Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding;
const parser = new LNoriParser();
export class LNoriExtension implements LNoriImplementation {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const discover_section: DiscoverSection[] = [];
    discover_section.push({
      id: "prominent",
      title: "Top",
      subtitle: "",
      type: DiscoverSectionType.featured,
    });
    discover_section.push({
      id: "seasonal",
      title: "Seasonal",
      subtitle: "",
      type: DiscoverSectionType.prominentCarousel,
    });
    discover_section.push({
      id: "popular",
      title: "Popular",
      subtitle: "",
      type: DiscoverSectionType.prominentCarousel,
    });
    return discover_section;
  }
  async getDiscoverSectionItems(
    section: DiscoverSection,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const html = await parseHTML(DOMAIN);
    switch (section.id) {
      case "prominent": {
        return parser.parseProminent(html);
      }
      case "seasonal": {
        return parser.extractSection(html, "winter-heading");
      }
      case "popular": {
        return parser.extractSection(html, "library-heading");
      }
      default:
        return { items: [] };
    }
  }
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const html = await parseHTML(`${DOMAIN}${mangaId}`);
    return parser.extractSeriesDetails(mangaId, html);
  }
  async getSearchResults(
    query: SearchQuery<{}>,
    metadata: undefined,
    sortingOption: undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const html = await parseHTML(`${DOMAIN}/library`);
    return parser.parseSearch(html, query.title);
  }

  async getChapters(sourceManga: SourceManga, sinceDate?: Date): Promise<Chapter[]> {
    const volumes: { title: string; link: string }[] = JSON.parse(
      sourceManga.mangaInfo.additionalInfo?.volumes ?? "",
    );
    return volumes.map((volume, index) => ({
      chapterId: volume.link,
      title: volume.title,
      sourceManga: sourceManga,
      langCode: "en",
      chapNum: index + 1,
    }));
  }
  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const html = await parseHTML(`${DOMAIN}${chapter.chapterId}`);
    return parser.parseChapter(chapter, html);
  }

  mainInterceptor = new MainInterceptor("main");

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }
}

export const LNori = new LNoriExtension();
