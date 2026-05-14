import type { JSONObject } from "@paperback/types";
import { MangaDot } from "./main";

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
  return (Application.getState("_type") as string[] | undefined) ?? ["JP", "CN&TW", "KR"];
}

export function getGenresHidden() {
  return (Application.getState("_genres") as string[] | undefined) ?? [];
}

export function defaultMetadata(): BaseMetadata {
  return {
    genres: Object.fromEntries(getGenresHidden().map((item) => [item, "excluded" as const])),
  };
}
