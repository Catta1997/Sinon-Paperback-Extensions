import { ContentRating } from "@paperback/types";
import { basePbConfig } from "../FansubGeneric/basePbConfig";

const pbConfig = basePbConfig;

pbConfig.name = "FMTeam";
pbConfig.description = "Extension that pulls manga from FMTeam.";
pbConfig.language = "fr";
pbConfig.icon = "icon.png";
pbConfig.contentRating = ContentRating.EVERYONE;
pbConfig.badges = [
  {
    label: "French 🇫🇷",
    textColor: "#ffffff",
    backgroundColor: "#2865ea",
  },
];

export default pbConfig;
