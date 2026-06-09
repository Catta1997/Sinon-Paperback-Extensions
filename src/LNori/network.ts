import {
  BasicRateLimiter,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: (Application.getState("RateFilter") as number | undefined) ?? 5,
  bufferInterval: 0.5,
  ignoreImages: true,
});

export class MainInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return request;
  }
  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return data;
  }
}

export async function parseHTML(url: string): Promise<string> {
  const data = (await Application.scheduleRequest({ url: url, method: "GET" }))[1];
  return Application.arrayBufferToUTF8String(data);
}
