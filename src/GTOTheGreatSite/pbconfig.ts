import { ContentRating, type ExtensionInfo } from "@paperback/types";
import { generalInfo } from "../FansubGeneric/genericInfo";

export default {
    name: "GTOTheGreatSite",
    description: "Extension that pulls manga from GTOTheGreatSite.",
    version: generalInfo.version,
    icon: "icon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
    capabilities: generalInfo.capabilities,
    badges: generalInfo.badges,
    developers: generalInfo.developers,
} satisfies ExtensionInfo;
