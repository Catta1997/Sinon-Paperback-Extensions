import { ContentRating } from "@paperback/types";
import { basePbConfig } from "../FansubGeneric/basePbConfig";

const pbConfig = basePbConfig;

pbConfig.name = "HastaTeam";
pbConfig.description = "Extension that pulls manga from HastaTeam.";
pbConfig.language = "it";
pbConfig.icon = "icon.png";
pbConfig.contentRating = ContentRating.EVERYONE;

export default pbConfig;
