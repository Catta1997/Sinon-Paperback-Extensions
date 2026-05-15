import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export const basePbConfig = {
  name: "",
  description: "",
  version: "1.0.2",
  icon: "",
  language: "",
  capabilities: [
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
  ],
  badges: [
    {
      label: "Italian 🇮🇹",
      textColor: "#ffffff",
      backgroundColor: "#28eac2",
    },
  ],
  developers: [
    {
      name: "Catta1997",
      website: "https://github.com/Catta1997",
    },
  ],
  contentRating: "SAFE" as ContentRating,
} satisfies ExtensionInfo;
