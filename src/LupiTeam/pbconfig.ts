import {
    ContentRating,
    SourceIntents,
    type ExtensionInfo,
} from "@paperback/types";

export default {
    name: "LupiTeam",
    description: "Extension that pulls manga from LupiTeam.",
    version: "1.0.0-alpha.1",
    icon: "icon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.CHAPTER_PROVIDING,
        SourceIntents.DISCOVER_SECIONS_PROVIDING,
        SourceIntents.SEARCH_RESULTS_PROVIDING,
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
