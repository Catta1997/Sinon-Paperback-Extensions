export type RokuMetadata = { page: string };

export interface SearchJson {
  "manga-cards": string[];
  next: string | null;
}

export interface MangaCardInfo {
  id?: string;
  coverImage?: string;
  title?: string;
  subtitle?: string;
}
