import { ContentRating, type ExtensionInfo } from "@paperback/types";
import { generalInfo } from "../MangaWorldGeneric/genericInfo";

export default {
    name: "MangaWorld",
    description: "Extension that pulls manga from MangaWorld.",
    version: generalInfo.version,
    icon: "icon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
    capabilities: generalInfo.capabilities,
    badges: generalInfo.badges,
    developers: generalInfo.developers,
} satisfies ExtensionInfo;
