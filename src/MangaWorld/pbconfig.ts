import { ContentRating, ExtensionInfo, SourceIntents } from "@paperback/types";

export default {
    version: "1.2.5",
    name: "MangaWorld",
    description: "Extension that pulls manga from MangaWorld.",
    icon: "MangaWorldIcon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
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
            backgroundColor: "#9ad3c7",
        },
    ],
    developers: [
        {
            name: "Catta1997",
            website: "https://github.com/Catta1997",
        },
    ],
} satisfies ExtensionInfo;
