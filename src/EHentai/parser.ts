import {
  ContentRating,
  type DiscoverSectionItem,
  type MangaInfo,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type Tag,
  type TagSection,
  type Chapter,
  type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { type CheerioAPI } from "cheerio";
import { Requests } from "./network";
import { type GalleryInfo, getLangFlag, type Metadata } from "./utils";
import { BASE_URL } from "./main";

const network = new Requests();
export class Parser {
  private capitalLetter(str: string): string {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
      .join(" ");
  }

  private parseTitle(str: string): string {
    return str
      .replaceAll(/(\[.*?]|\(.*?\))/g, "")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  private parseTable($: cheerio.CheerioAPI) {
    const results: {
      title: string;
      image: string;
      url: string;
      lang: string;
      artist: string;
      subtitle: string;
    }[] = [];
    $("tr")
      .has("td.gl1e")
      .each((i, el) => {
        const container = $(el);
        const title = container.find("div.glink").text().trim();
        const url = container.find("a").first().attr("href") ?? "";
        const image = container.find("img").attr("src") ?? "";
        let artist = "";
        let lang = "";
        container.find("td.tc").each((i, td) => {
          if ($(td).text().trim() === "artist:") {
            artist = $(td).next("td").find("div").first().text().trim();
          }
          if ($(td).text().trim() === "language:") {
            const langTexts = $(td)
              .next("td")
              .find("div.gt, div.gtl")
              .map((_, el) => $(el).text().trim())
              .get()
              .filter((text) => text && text.toLowerCase() !== "translated");
            lang = langTexts
              .map((text) => getLangFlag(text))
              .filter(Boolean)
              .join(" ");
          }
        });
        const subtitle = this.capitalLetter(
          [lang, artist].filter((v) => v.trim().length > 0).join(" | "),
        );
        results.push({
          title: title,
          image: image,
          url: url,
          lang: lang,
          artist: artist,
          subtitle: subtitle,
        });
      });
    return results;
  }

  async parseSearchResults(
    query: SearchQuery,
    metadata: Metadata,
  ): Promise<PagedResults<SearchResultItem>> {
    const html = await network.searchRequest(query, metadata);
    const $ = cheerio.load(html);
    const results: SearchResultItem[] = this.parseTable($).map((item) => ({
      mangaId: item.url?.replaceAll(`${BASE_URL}/g/`, "") ?? "",
      title: this.parseTitle(item.title),
      imageUrl: item.image,
      subtitle: item.subtitle,
      contentRating: ContentRating.ADULT,
    }));
    if (results.length == 0) {
      return {
        items: [],
        metadata: undefined,
      };
    }
    let nextValue = "";
    const nextEl = $("#unext");
    if (nextEl.is("a")) {
      const href = nextEl.attr("href") ?? "";
      const match = href.match(/next=([^&]+)/);
      nextValue = match && match[1] ? match[1] : "";
    }
    return {
      items: results,
      metadata: nextValue.length > 0 ? { page: nextValue } : undefined,
    };
  }

  async parseFeatured(): Promise<PagedResults<DiscoverSectionItem>> {
    const html = await network.getPopular();
    return this.parseDiscover(html, "prominentCarouselItem");
  }

  async parseRecent() {
    const html = await network.getRecent();
    return this.parseDiscover(html, "simpleCarouselItem");
  }

  private async parseDiscover(
    html: string,
    type: "prominentCarouselItem" | "simpleCarouselItem",
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const $ = cheerio.load(html);

    return {
      items: this.parseTable($).map((item) => ({
        type,
        mangaId: item.url.replace(`${BASE_URL}/g/`, ""),
        title: this.parseTitle(item.title),
        subtitle: item.subtitle,
        imageUrl: item.image,
        contentRating: ContentRating.ADULT,
      })),
    };
  }

  async parseMangaDetail(mangaID: string): Promise<SourceManga> {
    const html = await network.mangaDetailRequest(mangaID);
    const $ = cheerio.load(html);
    let artist = "";
    const additionalMangaInfo = this.parseGalleryInfo($);
    const tagSectionList: TagSection[] = [];
    tagSectionList.push({
      id: "category",
      title: "Category",
      tags: [
        {
          id: additionalMangaInfo.category.toLowerCase().replaceAll(" ", "_"),
          title: this.capitalLetter(additionalMangaInfo.category),
        },
      ],
    });
    let languages: string[] = [];
    $("#taglist tr").each((i, el) => {
      const row = $(el);

      const category = row.find("td.tc").text().trim().split(":")[0];

      const tags: Tag[] = row
        .find('td div[class^="gt"] > a')
        .map((i, a) => ({
          id: $(a).attr("id") ?? "",
          title: this.capitalLetter($(a).text().trim().replaceAll(/\s+/g, " ").trim()),
        }))
        .get();
      const artistTag = tags.find((tag) => tag.id.includes("ta_artist"));
      if (artistTag) {
        artist = artistTag.title;
      }
      if (category !== "artist" && category !== "language") {
        tagSectionList.push({
          id: category ?? "",
          title: this.capitalLetter(category ?? ""),
          tags: tags,
        });
      }
      if (category === "language") {
        tags.map((t) => {
          if (t.title !== "Translated") {
            if (getLangFlag(t.title.toLowerCase()).length > 0) {
              languages.push(`${getLangFlag(t.title.toLowerCase())} ${t.title}`);
            }
          }
        });
      }
    });
    const style = $("#gd1 > div").attr("style") ?? "";
    const match = style.match(/url\(([^)]+)\)/);
    const imageUrl = match ? match[1] : "";
    const title = $("#gn").text().trim();
    const secondaryTitle = $("#gj").text().trim();
    const updateTime = additionalMangaInfo.posted.replaceAll(" ", "T");
    const info: MangaInfo = {
      thumbnailUrl: imageUrl ?? "",
      synopsis: "",
      artist: this.capitalLetter(artist),
      rating: additionalMangaInfo.rating.average / 500,
      secondaryTitles: [this.parseTitle(secondaryTitle)],
      primaryTitle: this.parseTitle(title),
      contentRating: ContentRating.ADULT,
      tagGroups: tagSectionList,
      additionalInfo: {
        title: this.parseTitle(title).split("| ")[1] ?? "",
        pages: additionalMangaInfo.length.pages.toString(),
        language: languages.join(" | "),
        uploaded: updateTime,
        favorite: additionalMangaInfo.favs.text.replaceAll("times", "favorite"),
      },
      shareUrl: `https://e-hentai.org/g/${mangaID}`,
    };
    return { mangaId: mangaID, mangaInfo: info };
  }

  async parseChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const info = sourceManga.mangaInfo?.additionalInfo;
    return [
      {
        chapterId: sourceManga.mangaId,
        title: info?.title ?? undefined,
        sourceManga: sourceManga,
        chapNum: 1,
        volume: 0,
        langCode: info?.language ?? "",
        publishDate: new Date(info?.uploaded ?? ""),
        version: info?.pages ? `${info?.pages} Pages` : "",
        additionalInfo: { pages: info?.pages ?? "0" },
      },
    ];
  }

  async scrapeAllChapterPages(chapter: Chapter) {
    const images = await this.scrapeAllChapterPagesList(chapter);
    return {
      id: chapter.chapterId,
      mangaId: chapter.chapterId,
      pages: images,
    };
  }
  private getRow($: CheerioAPI, label: string): string {
    return $(`#gdd .gdt1:contains("${label}")`).next(".gdt2").text().trim();
  }
  private parseGalleryInfo($: CheerioAPI): GalleryInfo {
    const root = $("#gmid #gd3");
    const category = root.find("#gdc div").first().text().trim();
    let uploaderName = root.find("#gdn a").first().text().trim();
    const tags = $("#gmid #gd4");
    tags.find("td.tc").each((i, td) => {
      if ($(td).text().trim() === "artist:") {
        uploaderName = $(td).next("td").find("div").first().text().trim();
      }
    });
    const posted = this.getRow($, "Posted:");
    const lengthRaw = this.getRow($, "Length:");
    const favsRaw = this.getRow($, "Favorited:");
    const ratingAverage = parseFloat(
      $("#rating_label").text().replaceAll("Average:", "").replaceAll(".", "").trim(),
    );
    return {
      category: category,
      uploader: {
        name: uploaderName,
      },
      posted: posted,
      length: {
        pages: parseInt(lengthRaw),
      },
      favs: {
        text: favsRaw,
      },
      rating: {
        average: ratingAverage,
      },
    };
  }

  async scrapeAllChapterPagesList(chapter: Chapter) {
    const totalImages = Number(chapter?.additionalInfo?.pages ?? "0");
    if (totalImages === 0) return [];
    const IMAGES_PER_PAGE = 20;
    const totalPages = Math.ceil(totalImages / IMAGES_PER_PAGE);
    const pageUrls = Array.from(
      { length: totalPages },
      (_, page) => `${BASE_URL}/g/${chapter.chapterId}?p=${page}`,
    );
    const htmlPages = await Promise.all(pageUrls.map((url) => network.getChapterPages(url)));
    const results: string[] = [];

    for (const html of htmlPages) {
      const $ = cheerio.load(html);
      $("a[href^='https://e-hentai.org/s/']").each((_, el) => {
        if (results.length >= totalImages) return;
        const url = $(el).attr("href");
        if (url) results.push(url);
      });
      if (results.length >= totalImages) break;
    }

    return results;
  }
}
