import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "EHentai",
  description: "Extension that pulls content from E-Hentai.",
  version: "1.0.3",
  icon: "icon.png",
  contentRating: ContentRating.ADULT,
  capabilities: [
    SourceIntents.SETTINGS_FORM_PROVIDING |
      SourceIntents.DISCOVER_SECTION_PROVIDING |
      SourceIntents.SEARCH_RESULT_PROVIDING |
      SourceIntents.CHAPTER_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
