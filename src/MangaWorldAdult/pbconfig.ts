import { ContentRating, ExtensionInfo, SourceIntents } from "@paperback/types";

export default {
    version: "1.2.4",
    name: "MangaWorldAdult",
    description: "Extension that pulls manga from MangaWorldAdult.",
    icon: "MangaWorldAdultIcon.png",
    language: "it",
    contentRating: ContentRating.ADULT,
    capabilities: [
        SourceIntents.CHAPTER_PROVIDING,
        SourceIntents.DISCOVER_SECIONS_PROVIDING,
        SourceIntents.SEARCH_RESULTS_PROVIDING,
        SourceIntents.SETTINGS_FORM_PROVIDING,
    ],
    badges: [
        {
            label: "Italian",
            textColor: "#ffffff",
            backgroundColor: "#53c2ae",
        },
    ],
    developers: [
        {
            name: "Catta1997",
            website: "https://github.com/Catta1997",
        },
    ],
} satisfies ExtensionInfo;
