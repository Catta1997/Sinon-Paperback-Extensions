export interface ComicsListResponse {
    comics: ComicListItem[];
}

export interface ComicListItem {
    title: string;
    thumbnail: string;
    adult: number;
    slug: string;
    author: string;
    last_chapter: ComicDetailChapter;
}

export interface Genre {
    name: string;
    slug: string;
}

export interface Team {
    name: string;
    url: string;
}

export interface ComicDetailResponse {
    comic: ComicDetail;
}

export interface ComicDetail {
    title: string;
    thumbnail: string;
    thumbnail_small: string;
    description: string | null;
    alt_titles: string[];
    author: string | null;
    artist: string | null;
    genres: Genre[];
    status: string | null;
    adult: number;
    created_at: string;
    updated_at: string;
    rating: number;
    url: string;
    slug: string;
    chapters: ComicDetailChapter[];
}

export interface ComicDetailChapter {
    id: number | null;
    full_title: string;
    title: string | null;
    volume: number | null;
    chapter: number;
    language: string;
    teams: (Team | null)[];
    updated_at: string;
    published_on: string;
    url: string;
}

export interface ReadChapterResponse {
    chapter: ComicReadDetailChapter;
}

export interface ComicReadDetailChapter {
    pages: string[];
}
