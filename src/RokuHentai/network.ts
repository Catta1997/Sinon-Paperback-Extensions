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
    async getSearchResults(query: SearchQuery, metadata: RokuMetadata) {
        const page = metadata?.page ?? "";
        let baseURL: URL = new URL("https://rokuhentai.com/_search");
        if (query.title.length > 0) {
            baseURL.setQueryItem("q", query.title);
        }
        if (page.length > 0) {
            baseURL = new URL(page);
        }
        const data = await Application.scheduleRequest({
            url: baseURL.toString(),
            method: "GET",
        });
        const js = Application.arrayBufferToUTF8String(data[1]);
        return JSON.parse(js) as SearchJson;
    }
}
