import { ContentRating, type ExtensionInfo } from "@paperback/types";
import { generalInfo } from "../MangaWorldGeneric/genericInfo";

export default {
    name: "MangaWorldAdult",
    description: "Extension that pulls manga from MangaWorldAdult.",
    version: generalInfo.version,
    icon: "icon.png",
    language: "it",
    contentRating: ContentRating.ADULT,
    capabilities: generalInfo.capabilities,
    badges: generalInfo.badges,
    developers: generalInfo.developers,
} satisfies ExtensionInfo;
