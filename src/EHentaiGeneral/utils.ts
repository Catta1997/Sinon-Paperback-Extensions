import { type BaseMetadata, type FilterKey, languageAll } from "./models";

export type Metadata = { page: string };

export function getLangFlag(lang: string) {
  const langFlag = languageAll.find((language) => language.id === lang);
  return langFlag?.flag ?? "";
}

export function getDefLangStatus(): string[] {
  return (Application.getState("_languages") as string[] | undefined) ?? ["all"];
}

export function getDefLangGloablStatus(): string[] {
  return (Application.getState("_globalLanguages") as string[] | undefined) ?? ["all"];
}

export function getLanguages() {
  return languageAll.some((lang) => lang.id === "all")
    ? languageAll
    : [{ id: "all", value: "All", flag: "🌍" }, ...languageAll];
}

type FilterMetadata = Partial<Record<FilterKey, string[]>>;
export type SearchMetadata = BaseMetadata & FilterMetadata;

export function getDefaultCharacter() {
  return ((Application.getState("_character") as string | undefined) ?? "")
    .split(",")
    .filter(Boolean);
}
export function getDefaultFemale() {
  return ((Application.getState("_female") as string | undefined) ?? "").split(",").filter(Boolean);
}
export function getDefaultMale() {
  return ((Application.getState("_male") as string | undefined) ?? "").split(",").filter(Boolean);
}
export function getDefaultOther() {
  return ((Application.getState("_other") as string | undefined) ?? "").split(",").filter(Boolean);
}
export function getDefaultCosplayer() {
  return ((Application.getState("_cosplayer") as string | undefined) ?? "")
    .split(",")
    .filter(Boolean);
}
export function getDefaultArtist() {
  return ((Application.getState("_artist") as string | undefined) ?? "").split(",").filter(Boolean);
}
export function getDefaultParody() {
  return ((Application.getState("_parody") as string | undefined) ?? "").split(",").filter(Boolean);
}
export function getDefaultMixed() {
  return ((Application.getState("_mixed") as string | undefined) ?? "").split(",").filter(Boolean);
}
export function getDefaultGroup() {
  return ((Application.getState("_group") as string | undefined) ?? "").split(",").filter(Boolean);
}
export function getDefaultMetadata(favoriteID: string = ""): SearchMetadata {
  const character = getDefaultCharacter();
  const female = getDefaultFemale();
  const male = getDefaultMale();
  const other = getDefaultOther();
  const cosplayer = getDefaultCosplayer();
  const artist = getDefaultArtist();
  const parody = getDefaultParody();
  const mixed = getDefaultMixed();
  const group = getDefaultGroup();
  return {
    type: (Application.getState("_type") as string[]) ?? [],
    language: Object.fromEntries(
      getDefLangStatus().map((language) => [language, "included"]),
    ) as Record<string, "included" | "excluded">,
    ...(character.length > 0 && { character }),
    ...(female.length > 0 && { female }),
    ...(male.length > 0 && { male }),
    ...(other.length > 0 && { other }),
    ...(cosplayer.length > 0 && { cosplayer }),
    ...(artist.length > 0 && { artist }),
    ...(parody.length > 0 && { parody }),
    ...(mixed.length > 0 && { mixed }),
    ...(group.length > 0 && { group }),
    ...(favoriteID.length > 0 && { favoriteID }),
  };
}

export function capitalLetter(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(" ");
}
