import {
    PaperbackInterceptor,
    URL,
    type Request,
    type Response,
    type SearchQuery,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { Metadata } from "./utils";

export class MainInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        const pattern = /^https?:\/\/[^/]+\/s\/.+/;
        if (pattern.test(request.url)) {
            request.headers = { Cookie: "nw=1" };
        } else {
            request.headers = { Cookie: "sl=dm_1" };
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
        const pattern = /^https?:\/\/[^/]+\/s\/.+/;
        if (pattern.test(request.url)) {
            const html = Application.arrayBufferToUTF8String(data);
            const $ = cheerio.load(html);
            const div = $("#i3");
            const nh = div.find("img#img").attr("src") ?? request.url;
            const new_data = await Application.scheduleRequest({
                url: nh,
                method: "get",
            });
            data = new_data[1];
        }
        return data;
    }
}

export class Requests {
    async searchRequest(query: SearchQuery, metadata: Metadata) {
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        const types: string[] = [];
        const star: string[] = [];
        const language: string[] = [];
        const page = metadata?.page ?? "";
        const typeFilter: string | Record<string, "included" | "excluded"> =
            getFilterValue("typeFilter") ?? "";
        const ratingFilter: string | Record<string, "included" | "excluded"> =
            getFilterValue("ratingFilter") ?? "";
        const langFilter: string | Record<string, "included" | "excluded"> =
            getFilterValue("languageFilter") ?? "";
        if (typeFilter && typeof typeFilter === "object") {
            for (const tag of Object.entries(typeFilter)) {
                if (tag[1] == "included") types.push(tag[0]);
            }
        }
        if (langFilter && typeof langFilter === "object") {
            for (const tag of Object.entries(langFilter)) {
                if (tag[1] == "included") language.push(tag[0]);
            }
        }
        let ratingNumber = 0;
        types.forEach((type) => {
            ratingNumber += Number(type);
        });
        if (ratingFilter && typeof ratingFilter === "object") {
            for (const tag of Object.entries(ratingFilter)) {
                if (tag[1] == "included") star.push(tag[0]);
            }
        }
        const url: URL = new URL("https://e-hentai.org/");
        if (language.length > 0) {
            language.forEach((lang) => {
                query.title = `language:${lang}$ ${query.title}`;
            });
        }
        if (query.title.length > 0) {
            url.setQueryItem("f_search", query.title);
        }
        if (types.length > 0) {
            url.setQueryItem("f_cats", (1023 - ratingNumber).toString());
        }
        if (star.length > 0) {
            url.setQueryItem("f_srdd", star);
        }
        if (page.length > 0) {
            url.setQueryItem("next", page);
        }
        await Application.sleep(3);
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
