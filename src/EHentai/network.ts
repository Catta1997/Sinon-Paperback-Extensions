import {
  BasicRateLimiter,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
  type SearchQuery,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { type Metadata, type SearchMetadata } from "./utils";
import { BASE_URL } from "./main";
import { CompositeInterceptor, Interceptor } from "paperback-interceptors";

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: (Application.getState("RateFilter") as number | undefined) ?? 5,
  bufferInterval: 0.5,
  ignoreImages: true,
});
export class MainInterceptor extends PaperbackInterceptor {
  interceptors = new CompositeInterceptor([new ImageURLInterceptor()]);

  private validImgExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  isImageUrl(url: string): boolean {
    try {
      const pathname = new URL(url).path.toLowerCase();

      return this.validImgExtensions.some((ext) => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }
  override async interceptRequest(request: Request): Promise<Request> {
    // image URL
    if (this.isImageUrl(request.url)) {
      if (request.headers && request.headers["nl-link"]) {
        if (request.headers["first"]) {
          delete request.headers["first"];
          return request;
        } else {
          request.url = request.headers["nl-link"];
          return request;
        }
      }
    } else if (request.url.includes(`${BASE_URL}/g/`)) {
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
    return this.interceptors.intercept(request, response, data);
  }
}

export class Requests {
  buildFilter(query: string, filter: { id: string; value: string[] }) {
    filter.value.forEach((filterValue) => {
      if (filterValue.startsWith("-")) {
        query += ` -${filter.id}:${filterValue.split("-")[1]}`;
      } else {
        if (filter.id === "language" && filter.value.length > 0) {
          if (filterValue.startsWith("-")) {
            query += ` -~${filter.id}:${filterValue.split("-")[1]}`;
          } else {
            query += ` ~${filter.id}:${filterValue}`;
          }
        } else {
          query += ` ${filter.id}:${filterValue}`;
        }
      }
    });
    return query;
  }
  async searchRequest(query: SearchQuery<SearchMetadata>, metadata: Metadata) {
    const url = new URL(BASE_URL);
    const isValid = (n: number) => Number.isFinite(n) && n > 0;
    const typeFilter = query.metadata?.type ?? [];
    const languageFilter = Object.entries(query.metadata?.language ?? {}).map(
      ([k, v]) => `${v === "excluded" ? "-" : ""}${k}`,
    );
    const characterFilter = query.metadata?.character ?? [];
    const femaleFilter = query.metadata?.female ?? [];
    const maleFilter = query.metadata?.male ?? [];
    const artistFilter = query.metadata?.artist ?? [];
    const otherFilter = query.metadata?.other ?? [];
    const mixedFilter = query.metadata?.mixed ?? [];
    const parodyFilter = query.metadata?.parody ?? [];
    const rating = query.metadata?.rating ?? -1;

    if (typeFilter && typeof typeFilter === "object") {
      const ratingSum = typeFilter.reduce((totale, valore) => totale + Number(valore), 0);
      if (ratingSum > 0) {
        url.setQueryItem("f_cats", String(1023 - ratingSum));
      }
    }
    const filterMap = [
      {
        id: "language",
        value: languageFilter,
      },
      {
        id: "character",
        value: characterFilter,
      },
      {
        id: "female",
        value: femaleFilter,
      },
      {
        id: "male",
        value: maleFilter,
      },
      {
        id: "artist",
        value: artistFilter,
      },
      {
        id: "other",
        value: otherFilter,
      },
      {
        id: "mixed",
        value: mixedFilter,
      },
      {
        id: "parody",
        value: parodyFilter,
      },
    ];
    if (rating >= 0) {
      url.setQueryItem("f_srdd", rating.toString());
    }
    filterMap.forEach((filter) => {
      query.title = this.buildFilter(query.title, filter);
    });
    if (query.title) {
      url.setQueryItem("f_search", query.title);
    }
    const min = query.metadata?.minPages ?? 0;
    const max = query.metadata?.maxPages ?? 0;
    if (isValid(min)) url.setQueryItem("f_spf", String(min));
    if (isValid(max)) url.setQueryItem("f_spt", String(max));
    if (metadata?.page) {
      url.setQueryItem("next", metadata.page);
    }

    const data = await Application.scheduleRequest({
      url: url.toString(),
      method: "GET",
    });

    return Application.arrayBufferToUTF8String(data[1]);
  }

  async getSection(popular: boolean) {
    const filterValue = (Application.getState("_type") as string[]) ?? [];
    const ratingSum = filterValue.reduce((acc, val) => acc + Number(val), 0);
    const url = new URL(BASE_URL);
    if (popular) {
      url.setPath("popular");
    }
    url.setQueryItem("f_cats", String(1023 - ratingSum));
    const data = await Application.scheduleRequest({
      url: url.toString(),
      method: "GET",
    });
    return Application.arrayBufferToUTF8String(data[1]);
  }

  async mangaDetailRequest(mangaID: string) {
    const data = await Application.scheduleRequest({
      url: `${BASE_URL}/g/${mangaID}`,
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

export class ImageURLInterceptor extends Interceptor {
  protected async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    if (!request.url.includes(`${BASE_URL}/s/`)) {
      return data;
    }

    const html = Application.arrayBufferToUTF8String(data);

    const $ = cheerio.load(html);
    const div = $("#i3");
    const image = div.find("img#img");

    const newPage = image.attr("onerror") ?? "";
    const match = newPage.match(/'(\d+-\d+)'/);

    if (match?.[1]) {
      request.headers = {
        "nl-link": `${request.url}?nl=${match[1]}`,
        first: "1",
      };
    }

    request.url = image.attr("src") ?? request.url;

    return (await Application.scheduleRequest(request))[1];
  }
}
