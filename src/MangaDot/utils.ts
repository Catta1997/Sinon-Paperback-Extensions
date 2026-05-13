import type { JSONObject } from "@paperback/types";

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

export class MangaDotFilters {
  genres: string[] = [];
  status: { id: string; title: string }[] = [
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
  origin: { id: string; title: string }[] = [
    {
      id: "JP",
      title: "Manga",
    },
    {
      id: "KR",
      title: "Manhwa",
    },
    {
      id: "CN",
      title: "Manhua",
    },
  ];
}
