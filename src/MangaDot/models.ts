export const DOMAIN = "https://mangadot.net";
export const API = `${DOMAIN}/api`;
export interface MangaInfoAPI {
  manga: MangaInfo;
}

export interface SearchSuggestionsAPI {
  suggestions: string[];
}

export interface SearchInfoAPI {
  manga_list: MangaInfo[];
  pagination: { total_pages: number };
}

export interface ChapterPagesAPI {
  images: { url: string }[];
}

export interface MangaInfo {
  genres: string[];
  date_added: string;
  description: string;
  banner_image: string;
  content_rating: string | null;
  avg_rating: number | null;
  alt_titles: string[] | string | null;
  authors: string[] | string | null;
  artists: string[] | string | null;
  id: number;
  title: string;
  photo: string;
  status: string;
  last_chapter_date: string;
  chapter_count: number;
  is_blurworthy: boolean;
  is_adult: boolean;
}

export interface ApiRequestConfig {
  path: string | string[];
  query?: Record<string, string | string[]>;
  referer?: string;
}

export interface MangaChapterListAPI {
  id: number;
  chapter_number: number;
  volume_number: null | number;
  chapter_title: string;
  language: string;
  uploader_upload_status: string | null;
  group_name: string;
  date_added: string;
  scanlator_name: string;
}

export interface Volumes {
  cover_url: string;
}
