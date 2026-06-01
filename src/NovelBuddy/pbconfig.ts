import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaBuddy",
  description: "Extension that pulls content from MangaBuddy.",
  version: "1.0.0",
  icon: "icon.png",
  contentRating: ContentRating.MATURE,
  capabilities: [
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
