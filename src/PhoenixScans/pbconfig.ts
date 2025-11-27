import { ContentRating, type ExtensionInfo } from "@paperback/types";
import { generalInfo } from "../FansubGeneric/genericInfo";

export default {
    name: "PhoenixScans",
    description: "Extension that pulls manga from PhoenixScans.",
    version: generalInfo.version,
    icon: "icon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
    capabilities: generalInfo.capabilities,
    badges: generalInfo.badges,
    developers: generalInfo.developers,
} satisfies ExtensionInfo;
