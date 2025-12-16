import {
  BasicRateLimiter,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
  type SearchQuery,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { type Metadata } from "./utils";

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: 6,
  bufferInterval: 1,
  ignoreImages: true,
});
export class MainInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    if (request.url.includes(`https://e-hentai.org/s/`)) {
      mainRateLimiter.options.numberOfRequests = 30; //faster img preload
      if (request.headers && request.headers["x-intercepted"]) {
        delete request.headers["x-intercepted"];
        return request;
      } else {
        mainRateLimiter.options.numberOfRequests = 20; //scrape correct image
        const newRequest = request;
        newRequest.headers = { ["x-intercepted"]: "1" };
        const data = await Application.scheduleRequest(newRequest);
        const html = Application.arrayBufferToUTF8String(data[1]);
        const $ = cheerio.load(html);
        const div = $("#i3");
        const image = div.find("img#img");
        const new_page = image.attr("onerror") ?? "";
        const match = new_page.match(/'(\d+-\d+)'/);
        if (match && match[1]) {
          request.headers = {
            ["reloadImage"]: `${request.url}?nl=${match[1]}`,
          };
        }
        request.url = image.attr("src") ?? request.url;
        return request;
      }
    } else if (request.url.includes(`https://e-hentai.org/g/`)) {
      mainRateLimiter.options.numberOfRequests = 20; // scape pages
      request.headers = { Cookie: "nw=1" };
    } else {
      request.headers = { Cookie: "sl=dm_2" };
    }
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    void request;
    void response;
    return data;
  }
}

export class Requests {
  async searchRequest(query: SearchQuery, metadata: Metadata) {
    const getFilterValue = (id: string) => query.filters.find((filter) => filter.id == id)?.value;
    const types: string[] = [];
    const page = metadata?.page ?? "";
    const isValidNumber = (n: number) => Number.isFinite(n) && n > 0;
    const typeFilter: string | Record<string, "included" | "excluded"> =
      getFilterValue("typeFilter") ?? "";
    const ratingFilter: string | Record<string, "included" | "excluded"> =
      getFilterValue("ratingFilter") ?? "";
    const langFilter: string | Record<string, "included" | "excluded"> =
      getFilterValue("languageFilter") ?? "";
    const female: string | Record<string, "included" | "excluded"> =
      getFilterValue("femaleFilter") ?? "";
    const male: string | Record<string, "included" | "excluded"> =
      getFilterValue("maleFilter") ?? "";
    const character: string | Record<string, "included" | "excluded"> =
      getFilterValue("characterFilter") ?? "";
    const other: string | Record<string, "included" | "excluded"> =
      getFilterValue("otherFilter") ?? "";
    const series: string | Record<string, "included" | "excluded"> =
      getFilterValue("seriesFilter") ?? "";
    const expunged: string | Record<string, "included" | "excluded"> =
      getFilterValue("expungedFilter") ?? "";
    const minPages: string | Record<string, "included" | "excluded"> =
      getFilterValue("minPagesFilter") ?? "";
    const maxPages: string | Record<string, "included" | "excluded"> =
      getFilterValue("maxPagesFilter") ?? "";
    if (typeFilter && typeof typeFilter === "object") {
      for (const tag of Object.entries(typeFilter)) {
        if (tag[1] == "included") types.push(tag[0]);
      }
    }
    let ratingNumber = 0;
    types.forEach((type) => {
      ratingNumber += Number(type);
    });
    const url: URL = new URL("https://e-hentai.org/");
    if (langFilter && typeof langFilter === "string" && langFilter.length > 0) {
      query.title = `language:${langFilter}$ ${query.title}`;
    }
    if (types.length > 0) {
      url.setQueryItem("f_cats", (1023 - ratingNumber).toString());
    }
    if (ratingFilter && typeof ratingFilter === "string" && ratingFilter.length > 0) {
      url.setQueryItem("f_srdd", ratingFilter);
    }
    if (male && typeof male === "string" && male.length > 0) {
      male.split(",").forEach((maleElement) => {
        query.title = query.title = `male:"${maleElement}$" ${query.title}`;
      });
    }
    if (female && typeof female === "string" && female.length > 0) {
      female.split(",").forEach((femaleElement) => {
        query.title = query.title = `female:"${femaleElement}$" ${query.title}`;
      });
    }
    if (character && typeof character === "string" && character.length > 0) {
      character.split(",").forEach((characterElement) => {
        query.title = query.title = `character:"${characterElement}$" ${query.title}`;
      });
    }
    if (other && typeof other === "string" && other.length > 0) {
      other.split(",").forEach((otherElement) => {
        query.title = query.title = `other:"${otherElement}$" ${query.title}`;
      });
    }
    if (series && typeof series === "string" && series.length > 0) {
      series.split(",").forEach((otherElement) => {
        query.title = query.title = `parody:"${otherElement}$" ${query.title}`;
      });
    }
    if (query.title.length > 0) {
      url.setQueryItem("f_search", query.title);
    }
    if (expunged && typeof expunged === "string" && expunged.length > 0) {
      url.setQueryItem("f_sh", expunged);
    }
    const min = Number(minPages);
    const max = Number(maxPages);
    if (isValidNumber(max) && max < 10) {
      throw new Error("The page range maximum cannot be below 10");
    }
    if (isValidNumber(min) && isValidNumber(max) && max - min < 20) {
      throw new Error("Your page range filter is too narrow");
    }
    if (isValidNumber(min)) {
      url.setQueryItem("f_spf", String(min));
    }
    if (isValidNumber(max)) {
      url.setQueryItem("f_spt", String(max));
    }
    if (page.length > 0) {
      url.setQueryItem("next", page);
    }
    const data = await Application.scheduleRequest({
      url: url.toString(),
      method: "GET",
    });
    return Application.arrayBufferToUTF8String(data[1]);
  }

  async getPopular() {
    const data = await Application.scheduleRequest({
      url: `https://e-hentai.org/popular`,
      method: "GET",
    });
    return Application.arrayBufferToUTF8String(data[1]);
  }

  async getRecent() {
    const data = await Application.scheduleRequest({
      url: `https://e-hentai.org/`,
      method: "GET",
    });
    return Application.arrayBufferToUTF8String(data[1]);
  }

  async mangaDetailRequest(mangaID: string) {
    const data = await Application.scheduleRequest({
      url: `https://e-hentai.org/g/${mangaID}`,
      method: "GET",
    });
    return Application.arrayBufferToUTF8String(data[1]);
  }
  async getChapterPages(url: string) {
    const data = await Application.scheduleRequest({
      url: url,
      method: "GET",
    });
    return Application.arrayBufferToUTF8String(data[1]);
  }
}
