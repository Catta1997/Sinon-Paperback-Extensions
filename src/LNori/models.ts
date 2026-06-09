export interface Series {
  title: string;
  author: string;
  description: string;
  cover: string;
  link: string;
}

export interface PreviewNovel {
  title: string;
  cover: string;
  link: string;
}

export interface PreviewSection {
  season: string;
  items: PreviewNovel[];
}

export interface Volume {
  title: string;
  link: string;
}

export interface SeriesDetails {
  title: string;
  author: string;
  description: string;
  cover: string;
  genres: string[];
  volumes: Volume[];
}

export interface SeriesCard {
  title: string;
  author: string;
  cover: string;
  link: string;
}
