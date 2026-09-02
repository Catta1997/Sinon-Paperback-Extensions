import { ContentRating, type ExtensionInfo, SourceIntents } from "@paperback/types";

export const basePbConfig = {
  name: "EHentai",
  description: "Extension that pulls content from E-Hentai.",
  version: "1.2.5",
  icon: "icon.png",
  contentRating: ContentRating.ADULT,
  capabilities: [
    SourceIntents.SETTINGS_FORM_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.MANAGED_COLLECTION_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
