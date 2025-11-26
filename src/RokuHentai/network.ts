import {
    PaperbackInterceptor,
    SearchQuery,
    URL,
    type Request,
    type Response,
} from "@paperback/types";
import { RokuMetadata, SearchJson } from "./utils";

export class MainInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        return {
            url: request.url,
            method: request.method,
            headers: {
                Referer: "https://rokuhentai.com/",
            },
        };
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
    async requestSearchResults(query: SearchQuery, metadata: RokuMetadata) {
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        const languageFilter: string[] = [];
        const tagFilter: string[] = [];

        const language: string | Record<string, "included" | "excluded"> =
            getFilterValue("languages") ?? "";
        const tags: string | Record<string, "included" | "excluded"> =
            getFilterValue("tags") ?? "";
        if (language && typeof language === "object") {
            for (const tag of Object.entries(language)) {
                if (tag[1] == "included") languageFilter.push(tag[0]);
            }
        }
        if (tags && typeof tags === "object") {
            for (const tag of Object.entries(tags)) {
                if (tag[1] == "included") tagFilter.push(tag[0]);
            }
        }
        const page = metadata?.page ?? "";
        let keyword = query.title;
        const baseURL: URL = new URL("https://rokuhentai.com/_search");
        if (tagFilter.length > 0) {
            tagFilter.forEach((filter) => {
                keyword = `${keyword} tag:${filter}`;
            });
        }
        if (languageFilter.length > 0) {
            languageFilter.forEach((filter) => {
                keyword = `${keyword} language:${filter}`;
            });
        }
        if (keyword.length > 0) {
            baseURL.setQueryItem("q", keyword);
        }
        const data = await Application.scheduleRequest({
            url: page.length > 0 ? page : baseURL.toString(),
            method: "GET",
        });
        const js = Application.arrayBufferToUTF8String(data[1]);
        return JSON.parse(js) as SearchJson;
    }
}
