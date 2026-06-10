import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "LNori",
  description: "Extension that pulls content from LNori.",
  version: "1.0.4",
  icon: "icon.png",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.SETTINGS_FORM_PROVIDING |
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
