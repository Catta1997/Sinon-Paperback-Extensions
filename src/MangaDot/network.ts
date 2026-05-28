import { type Request, type Response, PaperbackInterceptor } from "@paperback/types";

import {
  composeInterceptors,
  cloudflareInterceptor,
  httpErrorInterceptor,
  type Interceptor,
} from "paperback-interceptors";
import { DOMAIN } from "./models";

export class MangaDotInterceptor extends PaperbackInterceptor {
  private interceptor = composeInterceptors(
    cloudflareInterceptor({ url: DOMAIN }),
    httpErrorInterceptor(),
    this.customInterceptResponse(),
  );
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        "user-agent": await Application.getDefaultUserAgent(),
        ...request.headers,
      },
    };
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return this.interceptor(request, response, data);
  }

  customInterceptResponse(): Interceptor {
    return async (req, response, data) => {
      //.....
      return data;
    };
  }
}
