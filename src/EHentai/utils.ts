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

function getLangFilter() {
  return (Application.getState("_languageFilter") as string[] | undefined) ?? [];
}

export function getLangFlag(lang: string) {
  const langFlag = languageFilter.find((language) => language.id === lang);
  return langFlag?.flag ?? lang;
}

export function getLanguageFilter() {
  const languages = languageFilter.filter((lang) => getLangFilter().includes(lang.id));
  languages.unshift({ id: "", value: "All", flag: "All" });
  return languages;
}

export const languageFilter = [
  { id: "afrikaans", value: "Afrikaans", flag: "🇿🇦" },
  { id: "albanian", value: "Albanian", flag: "🇦🇱" },
  { id: "arabic", value: "Arabic", flag: "🇸🇦" },
  { id: "armenian", value: "Armenian", flag: "🇦🇲" },
  { id: "bengali", value: "Bengali", flag: "🇧🇩" },
  { id: "bulgarian", value: "Bulgarian", flag: "🇧🇬" },
  { id: "catalan", value: "Catalan", flag: "🇪🇸" },
  { id: "chinese", value: "Chinese", flag: "🇨🇳" },
  { id: "croatian", value: "Croatian", flag: "🇭🇷" },
  { id: "czech", value: "Czech", flag: "🇨🇿" },
  { id: "danish", value: "Danish", flag: "🇩🇰" },
  { id: "dutch", value: "Dutch", flag: "🇳🇱" },
  { id: "english", value: "English", flag: "🇬🇧" },
  { id: "estonian", value: "Estonian", flag: "🇪🇪" },
  { id: "finnish", value: "Finnish", flag: "🇫🇮" },
  { id: "french", value: "French", flag: "🇫🇷" },
  { id: "german", value: "German", flag: "🇩🇪" },
  { id: "greek", value: "Greek", flag: "🇬🇷" },
  { id: "hebrew", value: "Hebrew", flag: "🇮🇱" },
  { id: "hindi", value: "Hindi", flag: "🇮🇳" },
  { id: "hungarian", value: "Hungarian", flag: "🇭🇺" },
  { id: "icelandic", value: "Icelandic", flag: "🇮🇸" },
  { id: "indonesian", value: "Indonesian", flag: "🇮🇩" },
  { id: "irish", value: "Irish", flag: "🇮🇪" },
  { id: "italian", value: "Italian", flag: "🇮🇹" },
  { id: "japanese", value: "Japanese", flag: "🇯🇵" },
  { id: "korean", value: "Korean", flag: "🇰🇷" },
  { id: "latvian", value: "Latvian", flag: "🇱🇻" },
  { id: "norwegian", value: "Norwegian", flag: "🇳🇴" },
  { id: "polish", value: "Polish", flag: "🇵🇱" },
  { id: "portuguese", value: "Portuguese", flag: "🇵🇹" },
  { id: "romanian", value: "Romanian", flag: "🇷🇴" },
  { id: "russian", value: "Russian", flag: "🇷🇺" },
  { id: "serbian", value: "Serbian", flag: "🇷🇸" },
  { id: "slovak", value: "Slovak", flag: "🇸🇰" },
  { id: "slovenian", value: "Slovenian", flag: "🇸🇮" },
  { id: "spanish", value: "Spanish", flag: "🇪🇸" },
  { id: "swedish", value: "Swedish", flag: "🇸🇪" },
  { id: "thai", value: "Thai", flag: "🇹🇭" },
  { id: "turkish", value: "Turkish", flag: "🇹🇷" },
  { id: "ukrainian", value: "Ukrainian", flag: "🇺🇦" },
  { id: "urdu", value: "Urdu", flag: "🇵🇰" },
  { id: "vietnamese", value: "Vietnamese", flag: "🇻🇳" },
];

export const ratingFilter: {
  id: string;
  value: string;
}[] = [
  {
    id: "",
    value: "Any Rating",
  },
  {
    id: "2",
    value: "2 Stars",
  },
  {
    id: "3",
    value: "3 Stars",
  },
  {
    id: "4",
    value: "4 Stars",
  },
  {
    id: "5",
    value: "5 Stars",
  },
];

export interface GalleryInfo {
  category: string;
  uploader: {
    name: string;
  };
  posted: string;
  language: {
    text: string;
  };
  length: {
    pages: number;
  };
  rating: {
    average: number;
  };
}
