export interface TagInfo {
  id: number;
  name: string;
  slug: string;
  icon_url: string;
}

export interface PopulateTag {
  data: TagInfo[];
}

export interface Page {
  id: number;
  page: number;
  source_url: string;
  thumbnail_url: string;
}

export interface MangaDetails {
  linkcode: string;
  title: string;
  alternative_title: string;
  image_url?: string;
  slug: string;
  uploaded_at: string;
  category: TagInfo;
  tags: TagInfo[];
}

export interface JSONSearch {
  data: MangaDetails[];
}

export interface GetMangaInfo {
  comic: MangaDetails;
  chapter: null;
  next_chapter: null;
  images: Page[];
}

export interface TagParsing {
  data: TagInfo[];
}

export interface Metadata {
  page: number;
}
