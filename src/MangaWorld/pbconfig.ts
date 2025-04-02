import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
	version: "0.6.7",
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
		SourceIntents.MANGA_PROGRESS
	],
	badges: [],
	developers: [
		{
			name: "Catta1997",
			website: "https://github.com/Catta1997",
		},
	],
} satisfies SourceInfo;
