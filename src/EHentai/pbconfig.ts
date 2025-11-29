import {
    ContentRating,
    SourceIntents,
    type ExtensionInfo,
} from "@paperback/types";

export default {
    name: "EHentai",
    description: "Extension that pulls content from EHentai",
    version: "1.0.0-alpha.3",
    icon: "icon.png",
    contentRating: ContentRating.ADULT,
    capabilities:
        SourceIntents.DISCOVER_SECIONS_PROVIDING |
        SourceIntents.SEARCH_RESULTS_PROVIDING |
        SourceIntents.CHAPTER_PROVIDING,
    badges: [],
    developers: [
        {
            name: "Catta1997",
            github: "https://github.com/Catta1997",
        },
    ],
} satisfies ExtensionInfo;
