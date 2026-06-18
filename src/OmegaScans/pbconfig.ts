import { ContentRating, type ExtensionInfo, SourceIntents } from "@paperback/types";

export default {
  name: "OmegaScans",
  description: "Extension that pulls content from Omegascans.org/",
  version: "1.0.0-alpha.1",
  icon: "icon.png",
  contentRating: ContentRating.ADULT,
  capabilities: [
    SourceIntents.SEARCH_RESULT_PROVIDING |
      SourceIntents.CHAPTER_PROVIDING |
      SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
