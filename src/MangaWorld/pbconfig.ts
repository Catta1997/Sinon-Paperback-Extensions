import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    version: "0.3.1",
    name: "MangaWorld",
    description: "Extension that pulls manga from MangaWorld (0.9).",
    icon: "icon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.COLLECTION_MANAGEMENT,
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
    ],
    badges: [],
    developers: [
        {
            name: "Paperback Community",
            website: "https://github.com/paperback-community",
        },
    ],
} satisfies SourceInfo;
