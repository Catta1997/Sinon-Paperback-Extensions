import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
	version: "0.1",
	name: "DevTestExtension",
	description: "Mangas from various sources.",
	icon: "icon.png",
	language: "it",
	contentRating: ContentRating.EVERYONE,
	capabilities: [
		SourceIntents.MANGA_CHAPTERS,
		SourceIntents.DISCOVER_SECIONS,
	],
	badges: [
		{
			label: "DEV",
			textColor: "#187480",
			backgroundColor: "#c2ecd8"
		}
	],
	developers: [
		{
			name: "Catta1997",
			website: "https://github.com/Catta1997",
		},
	],
} satisfies SourceInfo;
