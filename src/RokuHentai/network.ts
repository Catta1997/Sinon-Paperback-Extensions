import {
  PaperbackInterceptor,
  type SearchQuery,
  URL,
  type Request,
  type Response,
} from "@paperback/types";
import { type RokuMetadata, type SearchJson } from "./utils";
import { DOMAIN } from "./main";
import { CompositeInterceptor } from "paperback-interceptors";

export class MainInterceptor extends PaperbackInterceptor {
  interceptors = new CompositeInterceptor([]);

  override async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      ...request.headers,
      referer: DOMAIN,
      "user-agent": await Application.getDefaultUserAgent(),
    };
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
  async requestSearchResults(query: SearchQuery<{}>, metadata: RokuMetadata) {
    const page = metadata?.page ?? "";
    const keyword = query.title;
    const baseURL: URL = new URL(`${DOMAIN}_search`);
    if (keyword.length > 0) {
      baseURL.setQueryItem("q", keyword);
    }
    let url = baseURL.toString();
    const data = await Application.scheduleRequest({
      url: page.length > 0 ? page : url,
      method: "GET",
    });
    const js = Application.arrayBufferToUTF8String(data[1]);
    return JSON.parse(js) as SearchJson;
  }
}
