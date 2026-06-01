export interface SearchResponse {
  data: {
    items: NovelItem[];
  };
}

export interface NovelItem {
  id: string;
  url: string;
  name: string;
  cover: string;
}

export interface ChapterResponse {
  success: boolean;
  data?: {
    chapters?: ChapterItem[];
  };
}

export interface ChapterItem {
  id: string;
  url: string;
  name: string;
  updated_at?: string;
}

export interface ApiRequestConfig {
  page: number;
  query: string;
  limit: string;
}

export interface NovelInfo {
  props : {
    pageProps: {
      initialManga: {
        id: string,
        url: string,
        name: string,
        slug: string,
        cover: string,
        status: string,
        rating: number,
        isAdult: boolean,
        authors: {name: string, slug:string}[],
        artists: {name: string, slug:string}[],
        genres: {name: string, slug:string}[]
        summary: string
        chapters: ChapterList[]
      }
    }
  }
}

export interface ChapterList {
  id:string,
  name:string,
  slug:string,
  url:string,
  updatedAt:string,
  group:string | null,
  views:number,
  uploader:string | null,
  cv:string | number | null
  content_version: number | string| null
}