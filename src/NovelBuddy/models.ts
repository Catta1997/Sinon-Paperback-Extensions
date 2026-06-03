export interface SearchResponse {
  data: {
    items: NovelItem[];
    pagination: { has_next: boolean };
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
        authors: NameObject[];
        artists: NameObject[];
        genres: NameObject[];
        summary: string;
        cv: number;
      };
    };
  };
}

export interface GenresList {
  success: boolean;
  data: {
    items: NameObject[];
  };
}

export interface NameObject {
  name: string;
  slug: string;
}

export interface FilterType {
  id: string;
  value: string;
}

export type NovelBuddyMetadata = {
  page: number;
};

export type NovelBuddySearchMetadata = {
  genres?: Record<string, "included" | "excluded">;
  exclude?: string[];
  status?: string[];
  type?: string[];
  demographic?: string[];
};
