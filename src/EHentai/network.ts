import {
  BasicRateLimiter,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
  type SearchQuery,
  CloudflareError,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { type Metadata } from "./utils";
import { BASE_URL } from "./main";

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: (Application.getState("RateFilter") as number | undefined) ?? 5,
  bufferInterval: 0.5,
  ignoreImages: true,
});
export class MainInterceptor extends PaperbackInterceptor {
  private async getImage(request: Request) {
    const data = await Application.scheduleRequest(request);
    const html = Application.arrayBufferToUTF8String(data[1]);
    const $ = cheerio.load(html);
    const div = $("#i3");
    return div.find("img#img");
  }
  private getNLsSettings() {
    return (Application.getState("nlLink") as boolean | undefined) ?? false;
  }
  override async interceptRequest(request: Request): Promise<Request> {
    if (request.url.includes(`${BASE_URL}/s/`)) {
      if (request.headers && request.headers["x-intercepted"]) {
        delete request.headers["x-intercepted"];
        return request;
      } else {
        request.headers = { ["x-intercepted"]: "1" };
        let image = await this.getImage(request);

        // !request.url.includes("?nl=") -> first loaded page
        if (!request.url.includes("?nl=") && this.getNLsSettings()) {
          const new_page = image.attr("onerror") ?? "";
          const match = new_page.match(/'(\d+-\d+)'/);
          if (match && match[1]) {
            request.url = `${request.url}?nl=${match[1]}`;
            image = await this.getImage(request);
          }
        }
        request.url = image.attr("src") ?? request.url;
        return request;
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
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: request.url,
        method: request.method ?? "GET",
      });
    }

    return data;
  }
}

export class Requests {
  private applyFilters(filterIds: string[], query: SearchQuery): string {
    const prefix = filterIds
      .flatMap((id) => {
        const value = query.filters.find((f) => f.id === id)?.value;
        return typeof value === "string" && value.length
          ? value.split(/\s*,\s*/).map((v) => {
              const isNegated = v.startsWith("-");
              const cleanValue = isNegated ? v.slice(1) : v;
              return `${isNegated ? "-" : ""}${id}:"${cleanValue}$"`;
            })
          : [];
      })
      .join(" ");
    return prefix ? `${prefix} ${query.title}`.trim() : query.title;
  }

  async searchRequest(query: SearchQuery, metadata: Metadata) {
    const url = new URL(BASE_URL);

    const getFilter = (id: string) => query.filters.find((f) => f.id === id)?.value;

    const isValid = (n: number) => Number.isFinite(n) && n > 0;
    const typeFilter = getFilter("typeFilter");
    if (typeFilter && typeof typeFilter === "object") {
      const ratingSum = Object.entries(typeFilter)
        .filter(([, v]) => v === "included")
        .reduce((sum, [k]) => sum + Number(k), 0);

      if (ratingSum > 0) {
        url.setQueryItem("f_cats", String(1023 - ratingSum));
      }
    }
    const stringFilters: [string, string][] = [
      ["ratingFilter", "f_srdd"],
      ["expungedFilter", "f_sh"],
    ];

    stringFilters.forEach(([id, param]) => {
      const value = getFilter(id);
      if (typeof value === "string" && value.length) {
        url.setQueryItem(param, value);
      }
    });

    query.title = this.applyFilters(
      ["character", "language", "male", "female", "other", "parody", "author", "mixed"],
      query,
    );

    if (query.title) {
      url.setQueryItem("f_search", query.title);
    }

    const min = Number(getFilter("minPagesFilter"));
    const max = Number(getFilter("maxPagesFilter"));

    if (isValid(max) && max < 10) {
      throw new Error("The page range maximum cannot be below 10");
    }

    if (isValid(min) && isValid(max) && max - min < 20) {
      throw new Error("Your page range filter is too narrow");
    }

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
