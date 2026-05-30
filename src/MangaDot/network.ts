import { type Request, type Response, PaperbackInterceptor } from "@paperback/types";

import { CompositeInterceptor } from "paperback-interceptors";

export class MangaDotInterceptor extends PaperbackInterceptor {
  interceptors = new CompositeInterceptor([]);

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
    return this.interceptors.intercept(request, response, data);
  }
}
