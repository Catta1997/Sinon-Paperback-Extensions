export type RokuMetadata = { page: string };

export interface SearchJson {
    "manga-ids": string[];
    "manga-cards": string[];
    prev?: string;
    next?: string;
}

export interface MangaCardInfo {
    id?: string;
    searchPagination?: string;
    detailsUrl?: string;
    coverImage?: string;
    title?: string;
    subtitle?: string;
    imagesCount?: number;
    dateString?: string;
}
