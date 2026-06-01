import { load } from "cheerio";
import type { NovelInfo } from "./models";

export class NovelBuddyParser {
  parseNextData(html: string): NovelInfo {
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

    if (!match) {
      throw new Error("__NEXT_DATA__ not found");
    }

    return JSON.parse(match[1]) as NovelInfo;
  }

  parseDescription(summary?: string): string {
    if (!summary) return "";

    const $ = load(`<div>${summary}</div>`);

    $("br").replaceWith("\n");
    $("p").before("\n").after("\n");

    return $("div").text().trim();
  }
}
