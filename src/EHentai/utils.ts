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

export function getPopularLanguages() {
  return (Application.getState("popularLanguages") as boolean | undefined) ?? true;
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
export const languageFilterAll = [
  { id: "afrikaans", value: "Afrikaans", flag: "🇿🇦" },
  { id: "albanian", value: "Albanian", flag: "🇦🇱" },
  { id: "arabic", value: "Arabic", flag: "🇸🇦" },
  { id: "aramaic", value: "Aramaic", flag: "" },
  { id: "armenian", value: "Armenian", flag: "🇦🇲" },
  { id: "bengali", value: "Bengali", flag: "🇧🇩" },
  { id: "bosnian", value: "Bosnian", flag: "🇧🇦" },
  { id: "bulgarian", value: "Bulgarian", flag: "🇧🇬" },
  { id: "burmese", value: "Burmese", flag: "🇲🇲" },
  { id: "catalan", value: "Catalan", flag: "🏴" },
  { id: "cebuano", value: "Cebuano", flag: "🇵🇭" },
  { id: "cree", value: "Cree", flag: "🇨🇦" },
  { id: "creole", value: "Creole", flag: "🇭🇹" },
  { id: "croatian", value: "Croatian", flag: "🇭🇷" },
  { id: "czech", value: "Czech", flag: "🇨🇿" },
  { id: "danish", value: "Danish", flag: "🇩🇰" },
  { id: "dutch", value: "Dutch", flag: "🇳🇱" },
  { id: "esperanto", value: "Esperanto", flag: "" },
  { id: "estonian", value: "Estonian", flag: "🇪🇪" },
  { id: "finnish", value: "Finnish", flag: "🇫🇮" },
  { id: "georgian", value: "Georgian", flag: "🇬🇪" },
  { id: "greek", value: "Greek", flag: "🇬🇷" },
  { id: "gujarati", value: "Gujarati", flag: "🇮🇳" },
  { id: "hebrew", value: "Hebrew", flag: "🇮🇱" },
  { id: "hindi", value: "Hindi", flag: "🇮🇳" },
  { id: "hmong", value: "Hmong", flag: "" },
  { id: "hungarian", value: "Hungarian", flag: "🇭🇺" },
  { id: "icelandic", value: "Icelandic", flag: "🇮🇸" },
  { id: "irish", value: "Irish", flag: "🇮🇪" },
  { id: "javanese", value: "Javanese", flag: "🇮🇩" },
  { id: "kannada", value: "Kannada", flag: "🇮🇳" },
  { id: "kazakh", value: "Kazakh", flag: "🇰🇿" },
  { id: "khmer", value: "Khmer", flag: "🇰🇭" },
  { id: "kurdish", value: "Kurdish", flag: "" },
  { id: "ladino", value: "Ladino", flag: "" },
  { id: "lao", value: "Lao", flag: "🇱🇦" },
  { id: "latin", value: "Latin", flag: "" },
  { id: "latvian", value: "Latvian", flag: "🇱🇻" },
  { id: "marathi", value: "Marathi", flag: "🇮🇳" },
  { id: "mongolian", value: "Mongolian", flag: "🇲🇳" },
  { id: "ndebele", value: "Ndebele", flag: "🇿🇼" },
  { id: "nepali", value: "Nepali", flag: "🇳🇵" },
  { id: "norwegian", value: "Norwegian", flag: "🇳🇴" },
  { id: "oromo", value: "Oromo", flag: "🇪🇹" },
  { id: "papiamento", value: "Papiamento", flag: "🇨🇼" },
  { id: "pashto", value: "Pashto", flag: "🇦🇫" },
  { id: "persian", value: "Persian", flag: "🇮🇷" },
  { id: "punjabi", value: "Punjabi", flag: "🇮🇳" },
  { id: "romanian", value: "Romanian", flag: "🇷🇴" },
  { id: "sango", value: "Sango", flag: "🇨🇫" },
  { id: "sanskrit", value: "Sanskrit", flag: "🇮🇳" },
  { id: "serbian", value: "Serbian", flag: "🇷🇸" },
  { id: "shona", value: "Shona", flag: "🇿🇼" },
  { id: "slovak", value: "Slovak", flag: "🇸🇰" },
  { id: "slovenian", value: "Slovenian", flag: "🇸🇮" },
  { id: "somali", value: "Somali", flag: "🇸🇴" },
  { id: "swahili", value: "Swahili", flag: "🇹🇿" },
  { id: "swedish", value: "Swedish", flag: "🇸🇪" },
  { id: "tagalog", value: "Tagalog", flag: "🇵🇭" },
  { id: "tamil", value: "Tamil", flag: "🇮🇳" },
  { id: "telugu", value: "Telugu", flag: "🇮🇳" },
  { id: "tibetan", value: "Tibetan", flag: "" },
  { id: "tigrinya", value: "Tigrinya", flag: "🇪🇷" },
  { id: "turkish", value: "Turkish", flag: "🇹🇷" },
  { id: "ukrainian", value: "Ukrainian", flag: "🇺🇦" },
  { id: "urdu", value: "Urdu", flag: "🇵🇰" },
  { id: "welsh", value: "Welsh", flag: "" },
  { id: "yiddish", value: "Yiddish", flag: "" },
  { id: "zulu", value: "Zulu", flag: "🇿🇦" },
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
type BaseMetadata = {
  type?: string[];
  language?: Record<string, "included" | "excluded">;
  rating?: number;
  minPages?: number;
  maxPages?: number;
};
type FilterMetadata = Partial<Record<FilterKey, string[]>>;
export type SearchMetadata = BaseMetadata & FilterMetadata;

export type FilterKey = (typeof filterKeys)[number];
export const filterKeys = [
  "other",
  "female",
  "male",
  "character",
  "parody",
  "artist",
  "mixed",
  "cosplayer",
  "group",
] as const;
