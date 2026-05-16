import type { JSONObject } from "@paperback/types";
import { MangaDot } from "./main";
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
  status?: TagMap;
  origin?: TagMap;
  author?: string[];
  artist?: string[];
};

export interface MangaDotMetadata extends JSONObject {
  page: number;
}
type Tag = {
  id: string;
  title: string;
};

export class MangaDotFilters {
  private constructor(genres: string[]) {
    this.genres = genres.map((elem) => ({
      id: normalizeId(elem),
      title: deNormalizeId(elem),
    }));
  }

  static async create(): Promise<MangaDotFilters> {
    const genres = await MangaDot.api.getFilters();

    return new MangaDotFilters(genres);
  }
  genres: Tag[];
  status: Tag[] = [
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
  origin: Tag[] = [
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
  ];
}

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
    //
    //origin: Object.fromEntries(getContentTypes().map((item) => [item, "included" as const])),
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
