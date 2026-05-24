import { ContentRating, type JSONObject } from "@paperback/types";

import type { MangaDotApi } from "./api";
import type { MangaInfo } from "./models";

export function normalizeId(id: string): string {
  return id.replaceAll("-", "@#@").replaceAll("'", "&#@").replaceAll(" ", "#@&");
}

export function deNormalizeId(id: string): string {
  return id.replaceAll("@#@", "-").replaceAll("&#@", "'").replaceAll("#@&", " ");
}

type FilterValue = "included" | "excluded";
export type TagMap = Record<string, FilterValue>;
export type BaseMetadata = {
  genres?: TagMap;
  origin?: string[];
  status?: string[];
  author?: string[];
  artist?: string[];
  adult?: boolean;
};

export interface MangaDotMetadata extends JSONObject {
  page: number;
}
export type Tag = {
  id: string;
  title: string;
};

export const status: Tag[] = [
  {
    id: "",
    title: "Any",
  },
  {
    id: "Ongoing",
    title: "Ongoing",
  },
  {
    id: "Completed",
    title: "Completed",
  },
  {
    id: "Hiatus",
    title: "Interrupted",
  },
];

export const origin: Tag[] = [
  {
    id: "",
    title: "Any",
  },
  {
    id: "JP",
    title: "Manga",
  },
  {
    id: "KR",
    title: "Manhwa",
  },
  {
    id: "CN&TW",
    title: "Manhua",
  },
  {
    id: "ONESHOT",
    title: "Oneshot",
  },
];
export function getContentTypes() {
  return (Application.getState("_type") as string[] | undefined) ?? [""];
}

export function getSectionContentTypes() {
  return (Application.getState("_sectionType") as string[] | undefined) ?? [""];
}

export function getGenresHidden() {
  return (Application.getState("_genres") as string[] | undefined) ?? [];
}

export function getShowAdultStatus(): boolean {
  return (Application.getState("_adult") as boolean | undefined) ?? false;
}

export function defaultMetadata(): BaseMetadata {
  return {
    genres: Object.fromEntries(getGenresHidden().map((item) => [item, "excluded" as const])),
    adult: getShowAdultStatus(),
  };
}
function parseStringArray(value: string[] | string | null): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function getArrayArtists(mangaInfo: MangaInfo): string {
  return parseStringArray(mangaInfo.artists).join(",");
}

export function getArrayTitles(mangaInfo: MangaInfo): string[] {
  return parseStringArray(mangaInfo.alt_titles);
}

export function getArrayAuthor(mangaInfo: MangaInfo): string {
  return parseStringArray(mangaInfo.authors).join(",");
}

export function getDate(date: string) {
  if (date === null) return new Date();
  return new Date(date.split(".")[0].split("+")[0].replace(" ", "T"));
}

export function getRating(mangaInfo: MangaInfo) {
  if (mangaInfo.is_adult) return ContentRating.ADULT;
  if (mangaInfo.is_blurworthy) return ContentRating.MATURE;
  switch (mangaInfo.content_rating) {
    case "safe":
      return ContentRating.EVERYONE;
    case "suggestive":
      return ContentRating.EVERYONE;
    case "erotica":
      return ContentRating.MATURE;
    case "pornographic":
      return ContentRating.ADULT;
    default:
      return ContentRating.EVERYONE;
  }
}

export let genres: Tag[] = [];

function setGenreFilter(tags: Tag[]) {
  genres = tags;
  Application.setState(JSON.stringify(tags), "genres_filter");
}

export async function checkFilters(api: MangaDotApi): Promise<void> {
  await updateFilters(genres.length === 0, api);
}

export async function updateFilters(force: boolean, api: MangaDotApi): Promise<void> {
  const lastFilterFetch = Number(Application.getState("last-genres-fetch") ?? 0);
  const cached = lastFilterFetch + 172800 > new Date().valueOf() / 1000;
  if (cached && !force) {
    const cachedGenres = Application.getState("genres_filter") as string | undefined;
    if (cachedGenres === undefined) {
      await updateFilters(true, api);
      return;
    }
    setGenreFilter(JSON.parse(cachedGenres) as Tag[]);
  } else {
    const fetchedGenres = await api.getFilters();
    genres = fetchedGenres.map((elem) => ({
      id: normalizeId(elem),
      title: deNormalizeId(elem),
    }));
    setGenreFilter(genres);
    Application.setState(String(new Date().valueOf() / 1000), "last-genres-fetch");
  }
}
