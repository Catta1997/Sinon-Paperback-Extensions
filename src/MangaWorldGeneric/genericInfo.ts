import { SourceIntents } from "@paperback/types";

export const generalInfo = {
    version: "1.0.0-alpha.2",
    capabilities: [
        SourceIntents.CHAPTER_PROVIDING,
        SourceIntents.DISCOVER_SECIONS_PROVIDING,
        SourceIntents.SEARCH_RESULTS_PROVIDING,
        SourceIntents.SETTINGS_FORM_PROVIDING,
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
};
