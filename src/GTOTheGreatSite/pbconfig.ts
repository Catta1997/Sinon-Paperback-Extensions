import { ContentRating } from "@paperback/types";
import { basePbConfig } from "../FansubGeneric/basePbConfig";

const pbConfig = basePbConfig;

pbConfig.name = "GTOTheGreatSite";
pbConfig.description = "Extension that pulls manga from GTOTheGreatSite.";
pbConfig.language = "it";
pbConfig.icon = "icon.png";
pbConfig.contentRating = ContentRating.EVERYONE;

export default pbConfig;
