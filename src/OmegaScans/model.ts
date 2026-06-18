export const DOMAIN = "https://api.omegascans.org";

export type OmegaScansMetadata = { page: number };

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

export interface SectionSeries {
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
  free_chapters: ChapterElement[];
}

export interface ApiRequestConfig {
  path: string | string[];
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
}

export interface SearchResult extends SectionSeries {
  meta: { last_page: number };
}
