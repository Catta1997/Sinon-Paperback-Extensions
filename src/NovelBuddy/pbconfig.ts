import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "NovelBuddy",
  description: "Extension that pulls content from NovelBuddy.",
  version: "1.0.2",
  icon: "icon.png",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.DISCOVER_SECTION_PROVIDING |
      SourceIntents.SEARCH_RESULT_PROVIDING |
      SourceIntents.CHAPTER_PROVIDING,
  ],
  badges: [
    {
      label: "Novel",
      textColor: "#ffffff",
      backgroundColor: "#3baf4b",
    },
  ],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
