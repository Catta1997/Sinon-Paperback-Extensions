import * as cheerio from "cheerio";
import type { Series } from "./models";
import {
  type Chapter,
  type ChapterDetails,
  ContentRating,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";
import { fixVoidElements } from "../novelUtils";

export class LNoriParser {
  async parseProminent(html: string): Promise<PagedResults<DiscoverSectionItem>> {
    const $ = cheerio.load(html);
    const novels: Series[] = $("#hero-stack article.hero-card")
      .map((_, el) => {
        const article = $(el);
        return {
          title: article.attr("data-title") ?? "",
          author: article.attr("data-author") ?? "",
          description: article.attr("data-desc") ?? "",
          cover: article.attr("data-image") ?? "",
          link: article.attr("data-link") ?? "",
        };
      })
      .get();
    return {
      items: novels.map((item) => ({
        type: "featuredCarouselItem",
        mangaId: item.link,
        summary: item.description,
        title: item.title,
        supertitle: item.author,
        imageUrl: item.cover,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }

  async extractSection(
    html: string,
    sectionId: string,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const $ = cheerio.load(html);
    const heading = $(`#${sectionId}`).first();
    const header = heading.closest("header");
    const list = header.next("ul");
    const sections = {
      items: list
        .find("li")
        .map((_, el) => {
          const a = $(el).find("a").first();
          const img = a.find("img").first();
          return {
            title: img.attr("alt")?.trim() ?? "",
            cover: img.attr("src") ?? "",
            link: a.attr("href") ?? "",
          };
        })
        .get(),
    };
    return {
      items: sections.items.map((item) => ({
        type: "prominentCarouselItem",
        mangaId: item.link,
        title: item.title,
        imageUrl: item.cover,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }

  async extractSeriesDetails(mangaId: string, html: string): Promise<SourceManga> {
    const $ = cheerio.load(html);

    const title = $(".s-title").first().text().trim();

    const author = $(".author").first().text().trim();

    const cover = $(".cover-wrap img").first().attr("src") ?? "";

    const description = $('meta[name="description"]').attr("content") ?? "";

    const genres = [
      ...new Set(
        $('a[href^="/genre/"]')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter(Boolean),
      ),
    ];

    const volumes = $("section.vol-grid article.card")
      .map((_, el) => {
        const linkEl = $(el).find("figure.card-cover a").first();

        const title =
          $(el).find("h3.card-title span").text().trim() || linkEl.attr("aria-label") || "";

        return {
          title,
          link: linkEl.attr("href") ?? "",
        };
      })
      .get();

    return {
      mangaId: mangaId,
      mangaInfo: {
        thumbnailUrl: cover,
        synopsis: description,
        primaryTitle: title,
        secondaryTitles: [],
        contentRating: ContentRating.EVERYONE,
        contentType: "novel",
        additionalInfo: { volumes: JSON.stringify(volumes) },
      },
    };
  }
  async parseChapter(chapter: Chapter, html: string): Promise<ChapterDetails> {
    const $ = cheerio.load(html);
    const content = $(".content-body");
    const htmlSection = $.html(content);
    const contentDiv = fixVoidElements(htmlSection)
      .replaceAll(/\u00a0/g, " ")
      .replaceAll("&nbsp;", " ");
    return {
      type: "html",
      id: chapter.chapterId,
      mangaId: chapter.chapterId,
      html: `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${contentDiv}</body></html>`,
    };
  }

  async parseSearch(html: string, title: string): Promise<PagedResults<SearchResultItem>> {
    const $ = cheerio.load(html);

    let results = $("article.card:not([style*='display: none'])")
      .map((_, el) => {
        const card = $(el);
        return {
          title: card.attr("data-t")?.trim() ?? "",
          author: card.attr("data-a")?.trim() ?? "",
          cover: card.find("img").first().attr("src") ?? "",
          link: card.find("a").first().attr("href") ?? "",
        };
      })
      .get()
      .filter((item) => item.title && item.author && item.cover && item.link);
    results = results.filter(
      (card) =>
        card.title.toLowerCase().includes(title) || card.author.toLowerCase().includes(title),
    );
    const result = results.map((novel) => ({
      mangaId: novel.link,
      title: novel.title,
      subtitle: novel.author,
      imageUrl: novel.cover,
      contentRating: ContentRating.EVERYONE,
    }));
    return {
      items: results.map((novel) => ({
        mangaId: novel.link,
        title: novel.title,
        subtitle: novel.author,
        imageUrl: novel.cover,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }
}
