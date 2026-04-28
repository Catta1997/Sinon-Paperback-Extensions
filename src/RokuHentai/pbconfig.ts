import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "RokuHentai",
  description: "Extension that pulls content from RokuHentai.com",
  version: "1.0.0-alpha.3",
  icon: "icon.png",
  contentRating: ContentRating.ADULT,
  capabilities: [
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
