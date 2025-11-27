import {
    ContentRating,
    SourceIntents,
    type ExtensionInfo,
} from "@paperback/types";

export default {
    name: "MangaWorldAdult",
    description: "Extension that pulls manga from MangaWorldAdult.",
    version: "1.0.0-alpha.1",
    icon: "icon.png",
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
            label: "Italian 🇮🇹",
            textColor: "#ffffff",
            backgroundColor: "#28eac2",
        },
    ],
    developers: [
        {
            name: "Catta1997",
            website: "https://github.com/Catta1997",
        },
    ],
} satisfies ExtensionInfo;
