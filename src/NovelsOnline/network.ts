import { PaperbackInterceptor, type Request, type Response } from "@paperback/types";
import { CompositeInterceptor } from "paperback-interceptors";
export class MainInterceptor extends PaperbackInterceptor {
  interceptors = new CompositeInterceptor([]);

  override async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      ...request.headers,
      Referer: "https://novelsonline.org/",
      Origin: "https://novelsonline.org",
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
