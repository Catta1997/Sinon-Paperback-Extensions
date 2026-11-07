import { type BaseMetadata, type FilterKey, filterKeys, languageAll, typeFilter } from "./models";

export type Metadata = { page: string };

export function getLangFlag(lang: string) {
  const langFlag = languageAll.find((language) => language.id === lang);
  return langFlag?.flag ?? "";
}

export type LanguageStatus = Record<string, "excluded" | "included">;

function getLanguageState(key: string): LanguageStatus {
  return (Application.getState(key) as LanguageStatus | undefined) ?? { all: "included" };
}

export function getDefLangStatus(): LanguageStatus {
  return getLanguageState("_languages");
}

export function getDefLangGlobalStatus(): LanguageStatus {
  return getLanguageState("_globalLanguages");
}

/**
 * Normalizes a language selection coming from a TriStateSelectRow:
 * - "all" can never be excluded
 * - selecting "all" clears every other language
 * - selecting another language while "all" is active drops "all"
 * - an empty selection falls back to "all"
 */
export function normalizeLanguageSelection(
  previous: LanguageStatus,
  value: LanguageStatus,
): LanguageStatus {
  if (value.all === "excluded") value.all = "included";

  const hadAll = previous.all === "included";
  const hasAll = value.all === "included";

  if (!hadAll && hasAll) return { all: "included" };
  if (hadAll && hasAll && Object.keys(value).length > 1) delete value.all;
  return Object.keys(value).length === 0 ? { all: "included" } : value;
}

export function getLanguages() {
  return languageAll.some((lang) => lang.id === "all")
    ? languageAll
    : [{ id: "all", value: "All", flag: "🌍" }, ...languageAll];
}

export function getTypeOptions(): { id: string; title: string }[] {
  return typeFilter.map((type) => ({ id: type.id, title: type.value }));
}

export function getLanguageOptions(): { id: string; title: string }[] {
  return getLanguages().map((lang) => ({ id: lang.id, title: `${lang.flag} ${lang.value}` }));
}

type FilterMetadata = Partial<Record<FilterKey, string[]>>;
export type SearchMetadata = BaseMetadata & FilterMetadata;

/** Comma separated list stored in the app state, as an array without empty entries. */
export function getStateList(key: string): string[] {
  return ((Application.getState(`_${key}`) as string | undefined) ?? "").split(",").filter(Boolean);
}

function getBoolState(key: string): boolean {
  return (Application.getState(`_${key}`) as boolean | undefined) ?? false;
}

export function getDefaultMetadata(favoriteID: string = ""): SearchMetadata {
  const filters: FilterMetadata = {};
  for (const key of filterKeys) {
    const list = getStateList(key);
    if (list.length > 0) filters[key] = list;
  }
  return {
    type: (Application.getState("_type") as string[]) ?? [],
    language: getDefLangStatus(),
    ...filters,
    ...(favoriteID.length > 0 && { favoriteID }),
  };
}

export const getDisabledCustomLang = () => getBoolState("custom_lang");
export const getDisabledCustomUploader = () => getBoolState("custom_upl");
export const getDisabledCustomTags = () => getBoolState("custom_tags");
export const getDebugMode = () => getBoolState("debug");
export const getHideEmptyFav = () => getBoolState("emptyFav");

export function capitalLetter(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");
}

let needTableFix = false;
export const tableFix = {
  get needTableFix(): boolean {
    return needTableFix;
  },

  set needTableFix(value: boolean) {
    needTableFix = value;
  },
};
export function debugPrint(...data: any[]) {
  if (getDebugMode()) {
    console.log(data);
  }
}
