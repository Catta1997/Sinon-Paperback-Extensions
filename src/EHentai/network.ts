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
        if (request.url.includes(`https://e-hentai.org/s/`)) {
            if (request.headers && request.headers["x-intercepted"]) {
                delete request.headers["x-intercepted"];
                return request;
            } else {
                const newRequest = request;
                newRequest.headers = { ["x-intercepted"]: "1" };
                const data = await Application.scheduleRequest(newRequest);
                const html = Application.arrayBufferToUTF8String(data[1]);
                const $ = cheerio.load(html);
                const div = $("#i3");
                request.url = div.find("img#img").attr("src") ?? request.url;
                return request;
            }
        } else if (request.url.includes(`https://e-hentai.org/g/`)) {
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
        return data;
    }
}

export class Requests {
    async searchRequest(query: SearchQuery, metadata: Metadata) {
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        const types: string[] = [];
        const page = metadata?.page ?? "";
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
        console.log(ratingFilter);
        console.log(langFilter);
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
        if (
            langFilter &&
            typeof langFilter === "string" &&
            langFilter.length > 0
        ) {
            query.title = `language:${langFilter}$ ${query.title}`;
        }
        if (types.length > 0) {
            url.setQueryItem("f_cats", (1023 - ratingNumber).toString());
        }
        if (
            ratingFilter &&
            typeof ratingFilter === "string" &&
            ratingFilter.length > 0
        ) {
            url.setQueryItem("f_srdd", ratingFilter);
        }
        if (male && typeof male === "string" && male.length > 0) {
            query.title = query.title = `male:${male}$ ${query.title}`;
        }
        if (female && typeof female === "string" && female.length > 0) {
            query.title = query.title = `female:${female}$ ${query.title}`;
        }
        if (
            character &&
            typeof character === "string" &&
            character.length > 0
        ) {
            query.title =
                query.title = `character:${character}$ ${query.title}`;
        }
        if (query.title.length > 0) {
            url.setQueryItem("f_search", query.title);
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
