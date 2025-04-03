import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
	version: "0.6.9",
	name: "MangaAdult",
	description: "Extension that pulls manga from MangaAdult (0.9).",
	icon: "icon.png",
	language: "it",
	contentRating: ContentRating.ADULT,
	capabilities: [
		SourceIntents.COLLECTION_MANAGEMENT,
		SourceIntents.MANGA_CHAPTERS,
		SourceIntents.DISCOVER_SECIONS,
		SourceIntents.MANGA_SEARCH
	],
	badges: [],
	developers: [
		{
			name: "Catta1997",
			website: "https://github.com/Catta1997",
		},
	],
} satisfies SourceInfo;
