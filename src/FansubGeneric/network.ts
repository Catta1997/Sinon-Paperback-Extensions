import {
    PaperbackInterceptor,
    SearchQuery,
    URL,
    type Request,
    type Response,
} from "@paperback/types";
import { ReadChapterResponse } from "./models";

export class MainInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        return {
            url: request.url.replace("http://", "https://"),
            method: request.method,
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

export class APIRequests {
    apiBaseUrl: string;
    constructor(baseUrl: string) {
        this.apiBaseUrl = baseUrl;
    }
    async apiSearchResult(query: SearchQuery) {
        const searchApi = new URL(this.apiBaseUrl);
        const path = query.title.length > 0 ? "search" : "comics";
        searchApi.addPathComponent(path);
        searchApi.addPathComponent(query.title);
        const data = await Application.scheduleRequest({
            url: searchApi.toString(),
            method: "GET",
        });
        return Application.arrayBufferToUTF8String(data[1]);
    }

    async apiMangaDetails(mangaId: string, section: boolean = false) {
        const searchApi = new URL(this.apiBaseUrl);
        searchApi.addPathComponent("comics");
        if (!section) {
            searchApi.addPathComponent(mangaId);
        }
        const data = await Application.scheduleRequest({
            url: searchApi.toString(),
            method: "GET",
        });
        return Application.arrayBufferToUTF8String(data[1]);
    }

    async getChapterPages(chapterId: string) {
        const searchApi = new URL(this.apiBaseUrl);
        searchApi.addPathComponent(chapterId);
        const data = await Application.scheduleRequest({
            url: searchApi.toString(),
            method: "GET",
        });
        const html = Application.arrayBufferToUTF8String(data[1]);
        const json = JSON.parse(html) as ReadChapterResponse;
        return json.chapter.pages;
    }
}
