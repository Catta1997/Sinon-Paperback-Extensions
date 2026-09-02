import {
  BasicRateLimiter,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
  type SearchQuery,
  CookieStorageInterceptor,
  type Cookie,
} from "@paperback/types";
import * as cheerio from "cheerio";
import {
  getDebugMode,
  getDefLangGloablStatus,
  getDisabledCustomLang,
  getDisabledCustomTags,
  getDisabledCustomUploader,
  type Metadata,
  type SearchMetadata,
} from "./utils";
import { BASE_URL, loginManager, REQUIRE_LOGIN } from "./main";

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: (Application.getState("RateFilter") as number | undefined) ?? 5,
  bufferInterval: 0.5,
  ignoreImages: true,
});

export class MainInterceptor extends PaperbackInterceptor {
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
    if (Application.filterAdultTitles || Application.filterMatureTitles) {
      throw new Error("Content of this extension are hidden. Check Paperback content settings");
    }
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
      request.cookies = {
        nw: "1",
        ...request.cookies,
      };
    } else {
      request.cookies = {
        sl: "dm_2",
        ...request.cookies,
      };
    }
    request.headers = {
      "user-agent": await Application.getDefaultUserAgent(),
      ...request.headers,
    };
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    if (response.status >= 300 && response.status < 400) {
      const loggedIn = loginManager.isLoggedIn();
      if (REQUIRE_LOGIN) {
        throw new Error(
          loggedIn
            ? "ExHentai denied access, your account may not be eligible yet (7-day wait) or your session expired. Try re-login."
            : "Please log in to use ExHentai.",
        );
      }
      throw new Error(loggedIn ? "An Error occurred. Try re-login." : "Please log in on settings");
    }
    if (request.url.includes(`${BASE_URL}/g/`) && response.status === 404) {
      throw new Error("This Content is no More Available");
    }
    if (getDebugMode()) {
      if (request.headers) {
        const chiavi = Object.keys(request.headers);
        chiavi.forEach((chiave) => {
          console.log(`header ${chiave} detected`);
        });
      }
      if (request.cookies) {
        const chiavi = Object.keys(request.cookies);
        chiavi.forEach((chiave) => {
          console.log(`cookie ${chiave} detected`);
        });
      }
      console.log(
        `Request to ${request.url}, m:${request.method} s:${response.status} bl:${data.byteLength}`,
      );
    }
    return data;
  }
}

export class ImageURLInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:154.0) Gecko/20100101 Firefox/154.0",
    };
    return request;
  }
  override async interceptResponse(
    request: Request,
    _response: Response,
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

export class Network {
  buildFilter(query: string, filter: { id: string; value: string[] }) {
    filter.value.forEach((filterValue) => {
      if (filter.id === "language" && filter.value[0] === "all") {
        return;
      }
      if (filterValue.startsWith("-")) {
        query += ` -${filter.id}:${this.fixSpacedFilter(filterValue)}`;
      } else {
        if (filter.id === "language" && filter.value.length > 0) {
          if (filterValue.startsWith("-")) {
            query += ` -${filter.value.length > 1 ? "~" : ""}${filter.id}:${this.fixSpacedFilter(filterValue)}`;
          } else {
            query += ` ${filter.value.length > 1 ? "~" : ""}${filter.id}:${this.fixSpacedFilter(filterValue)}`;
          }
        } else {
          query += ` ${filter.id}:${this.fixSpacedFilter(filterValue)}`;
        }
      }
    });
    return query;
  }

  fixSpacedFilter(filter: string) {
    let toApply = filter;
    if (filter.includes("-")) {
      toApply = filter.split("-")[1];
    }
    if (toApply.includes(" ")) {
      toApply = `"${toApply}$"`;
    }
    return toApply;
  }

  async favoriteRequest(favLink: string) {
    const data = await Application.scheduleRequest({
      url: favLink,
      method: "GET",
    });

    return Application.arrayBufferToUTF8String(data[1]);
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
    if (query.metadata?.expunged) {
      url.setQueryItem("f_sh", "on");
    }
    if (getDisabledCustomUploader()) {
      url.setQueryItem("f_sfu", "on");
    }
    if (getDisabledCustomTags()) {
      url.setQueryItem("f_sft", "on");
    }
    if (getDisabledCustomLang()) {
      url.setQueryItem("f_sfl", "on");
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

  async getSection(path: string = "", metadata: Metadata) {
    const filterValue = (Application.getState("_type") as string[]) ?? [];
    const ratingSum = filterValue.reduce((acc, val) => acc + Number(val), 0);
    const url = new URL(BASE_URL);
    if (path.length > 0) {
      url.setPath(path);
    }
    if (metadata?.page) {
      url.setQueryItem("next", metadata.page);
    }
    const languageFilter = getDefLangGloablStatus();

    const languageFilterMap = Object.entries(languageFilter ?? {}).map(
      ([k, v]) => `${v === "excluded" ? "-" : ""}${k}`,
    );
    url.setQueryItem("f_cats", String(1023 - ratingSum));
    url.setQueryItem(
      "f_search",
      this.buildFilter("", { id: "language", value: languageFilterMap }),
    );
    if (getDisabledCustomUploader()) {
      url.setQueryItem("f_sfu", "on");
    }
    if (getDisabledCustomTags()) {
      url.setQueryItem("f_sft", "on");
    }
    if (getDisabledCustomUploader()) {
      url.setQueryItem("f_sfl", "on");
    }
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
  async getFevList() {
    const data = await Application.scheduleRequest({
      url: `${BASE_URL}/favorites.php`,
      method: "GET",
    });
    const html = Application.arrayBufferToUTF8String(data[1]);
    const $ = cheerio.load(html);
    return $("div.fp")
      .filter((_, el) => $(el).children("div").length === 3) // Skip "Show All Favorites"
      .map((_, el) => {
        const $el = $(el);
        return {
          id: $el.attr("onclick")?.match(/'([^']+)'/)?.[1] ?? "",
          value: $el.children("div").eq(2).text().trim(),
          number: Number($el.children("div").eq(0).text().trim()) ?? 0,
        };
      })
      .get();
  }
  async addToFavorite(mangaid: string, cetegoryId: string) {
    const favcat = cetegoryId.split("favcat=")[1];
    const [gid, t] = mangaid.split("/");
    await Application.scheduleRequest({
      url: `${BASE_URL}/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
      method: "POST",
      body: `favcat=${favcat}&favnote=&apply=Add+to+Favorites&update=1`,
    });
  }

  async deleteFromFavorite(mangaid: string) {
    const [gid, t] = mangaid.split("/");
    await Application.scheduleRequest({
      url: `${BASE_URL}/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
      method: "POST",
      body: `favcat=favdel&favnote=&apply=Apply+Changes&update=1`,
    });
  }
}

export class LogInManager {
  loginCookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  private readonly AUTH_COOKIE_NAMES = new Set(["ipb_member_id", "ipb_pass_hash"]);

  private getCookie(name: string) {
    return this.loginCookieStorageInterceptor.cookies.find((cookie) => cookie.name === name);
  }

  getAccountID(): string {
    return this.getCookie("ipb_member_id")?.value ?? "ERROR";
  }

  private isAuthCookie(cookie: Cookie): boolean {
    return this.AUTH_COOKIE_NAMES.has(cookie.name);
  }

  checkLoginCookie(cookies: Cookie[]) {
    const cookieNames = new Set(cookies.map((c) => c.name));
    return [...this.AUTH_COOKIE_NAMES].every((name) => cookieNames.has(name));
  }

  isLoggedIn(): boolean {
    const username = (Application.getSecureState(`${BASE_URL}_username`) as string) ?? "";
    if (username.length === 0) {
      this.logOut();
    }
    return username.length > 0;
  }

  async logIn(cookies: Cookie[]): Promise<void> {
    if (this.checkLoginCookie(cookies)) {
      cookies
        .filter((cookie) => this.isAuthCookie(cookie))
        .forEach((cookie) => {
          cookie.domain = BASE_URL.split("https://")[1];
          this.loginCookieStorageInterceptor.setCookie(cookie);
        });
      Application.setSecureState(this.getAccountID(), `${BASE_URL}_username`);
      Application.invalidateDiscoverSections();
    }
  }

  logOut(): void {
    this.loginCookieStorageInterceptor.cookies.forEach((cookie) => {
      this.loginCookieStorageInterceptor.deleteCookie(cookie);
    });
    Application.setSecureState(undefined, `${BASE_URL}_username`);
    Application.invalidateDiscoverSections();
  }
}
