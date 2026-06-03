import type { FilterType } from "./models";
import { NovelBuddyNetwork } from "./network";

export const STATUS: FilterType[] = [
  { id: "", value: "All Status" },
  { id: "ongoing", value: "ongoing" },
  { id: "completed", value: "Completed" },
  { id: "hiatus", value: "Hiatus" },
  { id: "cancelled", value: "Cancelled" },
];

export const CONTENT_TYPE: FilterType[] = [
  { id: "", value: "All Types" },
  { id: "manga", value: "Manga" },
  { id: "manhwa", value: "Manhwa" },
  { id: "manhua", value: "Manhua" },
];

export const DEMOGRAPHIC: FilterType[] = [
  { id: "", value: "All Types" },
  { id: "shounen", value: "Shounen" },
  { id: "shoujo", value: "Shoujo" },
  { id: "seinen", value: "Seinen" },
  { id: "josei", value: "Josei" },
];

export let GENRES: FilterType[] = [];

export async function fetchGenres(api: NovelBuddyNetwork) {
  const genreList = await api.getGenres();
  GENRES = genreList.data.items.map((genre) => ({ id: genre.slug, value: genre.name }));
}
