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
  debugPrint,
  getDefLangGlobalStatus,
  getDisabledCustomLang,
  getDisabledCustomTags,
  getDisabledCustomUploader,
  type Metadata,
  type SearchMetadata,
} from "./utils";
import { filterKeys } from "./models";
import { BASE_URL, loginManager, REQUIRE_LOGIN } from "./main";

/** Prefix shared by every gallery URL (`${BASE_URL}/g/`). */
const galleryPrefix = () => `${BASE_URL}/g/`;
export const galleryUrl = (mangaId: string) => `${galleryPrefix()}${mangaId}`;
export const galleryIdFromUrl = (url: string) => url.replace(galleryPrefix(), "");

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: (Application.getState("RateFilter") as number | undefined) ?? 5,
  bufferInterval: 1,
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
    } else if (request.url.includes(galleryPrefix())) {
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
    if (request.url.includes(galleryPrefix()) && response.status === 404) {
      throw new Error("This Content is no More Available");
    }
    if (request.cookies) {
      Object.entries(request.cookies).forEach(([chiave, valore]) => {
        if (chiave === "igneous" && valore.toLowerCase() === "mystery") {
          debugPrint(`[Request] Detected cookie "igneous=mystery". Removed`);
          if (request.cookies) {
            delete request.cookies["igneous"];
          }
        }
      });
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
  private parseFilterValue(value: string) {
    let negative = false;
    let weak = false;
    if (value.startsWith("-")) {
      negative = true;
      value = value.slice(1);
    }
    if (value.toLowerCase().startsWith("weak:")) {
      weak = true;
      value = value.slice(5);
    }
    return { value, negative, weak };
  }

  buildFilter(query: string, filter: { id: string; value: string[] }) {
    const isLanguage = filter.id === "language";
    if (isLanguage && filter.value[0] === "all") {
      return query;
    }
    // several languages are combined with OR (`~`), weak tags only exist for non-language filters
    const or = isLanguage && filter.value.length > 1 ? "~" : "";
    for (const rawValue of filter.value) {
      const { value, negative, weak } = this.parseFilterValue(rawValue);
      const weakPrefix = !isLanguage && weak ? "weak:" : "";
      query += ` ${negative ? "-" : ""}${or}${weakPrefix}${filter.id}:${this.fixSpacedFilter(value)}`;
    }
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

  /** GET `url` and return the body as text. */
  async fetchHtml(url: string): Promise<string> {
    const [, data] = await Application.scheduleRequest({ url, method: "GET" });
    return Application.arrayBufferToUTF8String(data);
  }

  /** `{ all: "included", en: "excluded" }` -> `["all", "-en"]` */
  private languageToTokens(status: Record<string, "included" | "excluded"> | undefined) {
    return Object.entries(status ?? {}).map(([lang, state]) =>
      state === "excluded" ? `-${lang}` : lang,
    );
  }

  /** f_cats is a bitmask of the categories to *hide*, so the selected ones are subtracted. */
  private setCategoryFilter(url: URL, types: string[], skipIfEmpty: boolean) {
    const selected = types.reduce((total, type) => total + Number(type), 0);
    if (skipIfEmpty && selected <= 0) return;
    url.setQueryItem("f_cats", String(1023 - selected));
  }

  /** Applies the "disable my custom filters" account settings. */
  private applyCustomFilters(url: URL) {
    if (getDisabledCustomUploader()) url.setQueryItem("f_sfu", "on");
    if (getDisabledCustomTags()) url.setQueryItem("f_sft", "on");
    if (getDisabledCustomLang()) url.setQueryItem("f_sfl", "on");
  }

  async searchRequest(query: SearchQuery<SearchMetadata>, metadata: Metadata) {
    const url = new URL(BASE_URL);
    const isValid = (n: number) => Number.isFinite(n) && n > 0;
    const rating = query.metadata?.rating ?? -1;

    this.setCategoryFilter(url, query.metadata?.type ?? [], true);
    if (rating >= 0) {
      url.setQueryItem("f_srdd", rating.toString());
    }

    const filters = [
      { id: "language", value: this.languageToTokens(query.metadata?.language) },
      ...filterKeys.map((id) => ({ id, value: query.metadata?.[id] ?? [] })),
    ];
    for (const filter of filters) {
      query.title = this.buildFilter(query.title, filter);
    }
    if (query.title) {
      url.setQueryItem("f_search", query.title);
    }
    if (query.metadata?.expunged) {
      url.setQueryItem("f_sh", "on");
    }
    this.applyCustomFilters(url);

    const min = query.metadata?.minPages ?? 0;
    const max = query.metadata?.maxPages ?? 0;
    if (isValid(min)) url.setQueryItem("f_spf", String(min));
    if (isValid(max)) url.setQueryItem("f_spt", String(max));
    if (metadata?.page) {
      url.setQueryItem("next", metadata.page);
    }

    return this.fetchHtml(url.toString());
  }

  async getSection(path: string = "", metadata: Metadata) {
    const url = new URL(BASE_URL);
    if (path.length > 0) {
      url.setPath(path);
    }
    if (metadata?.page) {
      url.setQueryItem("next", metadata.page);
    }
    this.setCategoryFilter(url, (Application.getState("_type") as string[]) ?? [], false);
    url.setQueryItem(
      "f_search",
      this.buildFilter("", {
        id: "language",
        value: this.languageToTokens(getDefLangGlobalStatus()),
      }),
    );
    this.applyCustomFilters(url);

    return this.fetchHtml(url.toString());
  }

  mangaDetailRequest(mangaID: string) {
    return this.fetchHtml(galleryUrl(mangaID));
  }

  async getFevList() {
    const $ = cheerio.load(await this.fetchHtml(`${BASE_URL}/favorites.php`));
    return $("div.fp")
      .filter((_, el) => $(el).children("div").length === 3) // Skip "Show All Favorites"
      .map((_, el) => {
        const $el = $(el);
        const favNumber = Number($el.children("div").eq(0).text().trim());
        return {
          id: $el.attr("onclick")?.match(/'([^']+)'/)?.[1] ?? "",
          title: $el.children("div").eq(2).text().trim(),
          number: isNaN(favNumber) ? 0 : favNumber,
        };
      })
      .get();
  }
  private async postFavorite(mangaId: string, body: string) {
    const [gid, t] = mangaId.split("/");
    await Application.scheduleRequest({
      url: `${BASE_URL}/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
      method: "POST",
      body,
    });
  }

  async addToFavorite(mangaid: string, cetegoryId: string) {
    const favcat = cetegoryId.split("favcat=")[1];
    await this.postFavorite(mangaid, `favcat=${favcat}&favnote=&apply=Add+to+Favorites&update=1`);
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
