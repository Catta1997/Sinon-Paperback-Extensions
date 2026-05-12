import type { JSONObject } from "@paperback/types";

export const DOMAIN = "https://mangadot.net";
export const API = `${DOMAIN}/api`;
export interface MangaInfoAPI {
  manga: MangaInfo;
}

interface MangaInfo extends SectionManga {
  genres: string[];
  date_added: string;
  description: string;
  source_url: string;
  banner_image: string;
  is_hot: boolean;
  avg_rating: number;
  alt_titles: string[];
  authors: string[] | string;
  artists: string[] | string;
  is_adult: boolean;
}

export interface SearchInfoAPI {
  manga_list: MangaInfo[];
}

export interface ChapterPagesAPI {
  images: ChapterPages[];
}

interface ChapterPages {
  url: string;
  w: number;
  h: number;
}

export interface MangaSectionAPI {
  items: SectionManga[];
}

interface SectionManga {
  id: number;
  title: string;
  photo: string;
  status: string;
  hiatus: string;
  country_of_region: string;
  is_blurworthy: boolean;
}
export interface ApiRequestConfig {
  path: string | string[];
  query?: Record<string, string | string[]>;
  referer?: string;
}

export interface MangaChapterListAPI {
  id: string;
  chapter_number: string;
  volume_number: null | string;
  chapter_title: string;
  language: string;
  group_id: string;
  group_name: string;
  date_added: string;
  scanlator_name: string;
}

export interface MangaDotMetadata extends JSONObject {
  page: number;
}

type FilterValue = "included" | "excluded";
export type TagMap = Record<string, FilterValue>;
export type BaseMetadata = {
  genres?: TagMap;
  status?: TagMap;
  origin?: TagMap;
};
