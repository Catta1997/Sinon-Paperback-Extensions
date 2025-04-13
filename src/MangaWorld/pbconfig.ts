import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    version: "1.0 - beta 5",
    name: "MangaWorld",
    description: "Extension that pulls manga from MangaWorld (0.9).",
    icon: "MangaWorldIcon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.COLLECTION_MANAGEMENT,
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
    ],
    developers: [
        {
            name: "Catta1997",
            website: "https://github.com/Catta1997",
        },
    ],
} satisfies SourceInfo;
