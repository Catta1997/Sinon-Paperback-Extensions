import type { JSONObject } from "@paperback/types";

export interface SearchResponse {
  data: {
    items: NovelItem[];
    pagination: { limit: number };
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
  sort: string;
}

export interface NovelInfo {
  props: {
    pageProps: {
      initialManga: {
        id: string;
        url: string;
        name: string;
        slug: string;
        cover: string;
        status: string;
        rating: number;
        isAdult: boolean;
        authors: { name: string; slug: string }[];
        artists: { name: string; slug: string }[];
        genres: { name: string; slug: string }[];
        summary: string;
        cv: number;
      };
    };
  };
}

export interface NovelBuddyMetadata extends JSONObject {
  page: number;
}
