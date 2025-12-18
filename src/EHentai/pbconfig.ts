import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "EHentai",
  description: "Extension that pulls content from E-Hentai.",
  version: "1.0.0-alpha.11",
  icon: "icon.png",
  contentRating: ContentRating.ADULT,
  capabilities:
    SourceIntents.SETTINGS_FORM_PROVIDING |
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
