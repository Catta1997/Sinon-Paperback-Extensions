import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    version: "1.0 - beta 8",
    name: "MangaAdult",
    description: "Extension that pulls manga from MangaAdult (0.9).",
    icon: "MangaAdultIcon.png",
    language: "it",
    contentRating: ContentRating.ADULT,
    capabilities: [
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.SETTINGS_UI,
    ],
    badges: [
        {
            label: "Italian",
            textColor: "#187480", //c2ecd8
            backgroundColor: "#c2ecd8",
        },
        {
            label: "NSFW",
            textColor: "#ff0000", //c2ecd8
            backgroundColor: "#000000",
        },
    ],
    developers: [
        {
            name: "Catta1997",
            website: "https://github.com/Catta1997",
        },
    ],
} satisfies SourceInfo;
