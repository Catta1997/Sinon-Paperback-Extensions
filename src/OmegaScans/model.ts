import type { JSONObject } from "@paperback/types";

export const API = "https://api.omegascans.org";

export type OmegaScansMetadata = { page: number };

export interface OmegaScansSearchMetadata extends JSONObject {
  tags_ids?: string[];
  series_type?: string[];
}

export interface ChapterPages {
  chapter: {
    id: number;
    chapter_data: { images: string[] };
  };
}

export interface ElementInfo {
  id: number;
  title: string;
  series_slug: string;
  author?: string;
  thumbnail: string;
  description: string;
  series_type: string;
  tags: tagInfo[];
  rating: number;
  status: string;
  alternative_names: string;
  studio: string;
}

interface tagInfo {
  id: number;
  name: string;
}

export interface ChapterList {
  data: ChapterElement[];
}

interface ChapterElement {
  id: number;
  chapter_name: string;
  chapter_title: string;
  chapter_slug: string;
  price: number;
  created_at: string;
}

export interface Trending {
  title: string;
  id: number;
  thumbnail: string;
  series_slug: string;
  description: string;
  latest_chapter: null | string;
}

export interface SearchResult {
  meta: { last_page: number };
  data: SectionElement[];
}

interface SectionElement {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  created_at: string;
  updated_at: string;
  series_slug: string;
  rating?: number;
  status?: string;
  free_chapters: ChapterElement[];
}

export interface ApiRequestConfig {
  path: string | string[];
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
}

export interface Tags {
  id: number;
  name: string;
}

export interface NovelContent {
  chapter: { chapter_content: string };
}

export type Info = { symbol: string; text: string };
