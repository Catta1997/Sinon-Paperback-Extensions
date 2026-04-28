import type { JSONObject } from "@paperback/types";

export type Metadata = { page: string };

export const typeFilter: {
  id: string;
  value: string;
}[] = [
  {
    id: "2",
    value: "Doujinshi",
  },
  {
    id: "4",
    value: "Manga",
  },
  {
    id: "8",
    value: "Artist CG",
  },
  {
    id: "16",
    value: "Game CG",
  },
  {
    id: "512",
    value: "Western",
  },
  {
    id: "256",
    value: "Non-H",
  },
  {
    id: "32",
    value: "Image Set",
  },
  {
    id: "64",
    value: "Cosplay",
  },
  {
    id: "128",
    value: "Asian Porn",
  },
  {
    id: "1",
    value: "Misc",
  },
];

export function getLangFlag(lang: string) {
  const langFlag = languageFilter.find((language) => language.id === lang);
  return langFlag?.flag ?? "";
}

export function getLanguageFilter() {
  const languages = languageFilter; //.filter((lang) => getLangFilter().includes(lang.id));
  languages.unshift({ id: "all", value: "All", flag: "All" });
  return languages;
}

export const languageFilter = [
  { id: "chinese", value: "Chinese", flag: "🇨🇳" },
  { id: "english", value: "English", flag: "🇬🇧" },
  { id: "french", value: "French", flag: "🇫🇷" },
  { id: "german", value: "German", flag: "🇩🇪" },
  { id: "indonesian", value: "Indonesian", flag: "🇮🇩" },
  { id: "italian", value: "Italian", flag: "🇮🇹" },
  { id: "japanese", value: "Japanese", flag: "🇯🇵" },
  { id: "korean", value: "Korean", flag: "🇰🇷" },
  { id: "polish", value: "Polish", flag: "🇵🇱" },
  { id: "portuguese", value: "Portuguese", flag: "🇵🇹" },
  { id: "russian", value: "Russian", flag: "🇷🇺" },
  { id: "spanish", value: "Spanish", flag: "🇪🇸" },
  { id: "thai", value: "Thai", flag: "🇹🇭" },
  { id: "vietnamese", value: "Vietnamese", flag: "🇻🇳" },
];

export interface GalleryInfo {
  category: string;
  uploader: {
    name: string;
  };
  posted: string;
  favs: {
    text: string;
  };
  length: {
    pages: number;
  };
  rating: {
    average: number;
  };
}

export interface SearchMetadata extends JSONObject {
  type?: string[];
  language?: string[];
  male?: string[];
  female?: string[];
  character?: string[];
  other?: string[];
  parody?: string[];
  author?: string[];
  mixed?: string[];
  rating?: number;
  minPages?: number;
  maxPages?: number;
}
