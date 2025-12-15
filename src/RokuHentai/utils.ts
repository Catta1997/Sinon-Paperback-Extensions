export type RokuMetadata = { page: string };

export interface SearchJson {
  "manga-cards": string[];
  next: string | null;
}

export interface MangaCardInfo {
  id?: string;
  coverImage?: string;
  title?: string;
  subtitle?: string;
}

export const filter_lang = [
  { id: "arabic", value: "Arabic" },
  { id: "english", value: "English" },
  { id: "french", value: "French" },
  { id: "italian", value: "Italian" },
  { id: "korean", value: "Korean" },
  { id: "polish", value: "Polish" },
  { id: "russian", value: "Russian" },
  { id: "spanish", value: "Spanish" },
  { id: "thai", value: "Thai" },
  { id: "ukrainian", value: "Ukrainian" },
  { id: "vietnamese", value: "Vietnamese" },
];

export const filter_tags = [
  { id: "ai%20generated", value: "AI generated" },
  { id: "anthology", value: "Anthology" },
  { id: "color", value: "Color" },
  { id: "manga", value: "Manga" },
];
