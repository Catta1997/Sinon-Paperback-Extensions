import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "HentaiHand",
  description: "Extension that pulls content from HentaiHand",
  version: "1.0.0-alpha.4",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.ADULT,
  capabilities: [
    SourceIntents.DISCOVER_SECTION_PROVIDING |
      SourceIntents.SEARCH_RESULT_PROVIDING |
      SourceIntents.CHAPTER_PROVIDING |
      SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
