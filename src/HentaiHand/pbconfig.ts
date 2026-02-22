import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "HentaiHand",
  description: "Extension that pulls content from HentaiHand",
  version: "1.0.0-alpha.3",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.ADULT,
  capabilities:
    SourceIntents.DISCOVER_SECIONS_PROVIDING |
    SourceIntents.SEARCH_RESULTS_PROVIDING |
    SourceIntents.CHAPTER_PROVIDING |
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  badges: [],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
