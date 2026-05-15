import { ContentRating } from "@paperback/types";
import { basePbConfig } from "../FansubGeneric/basePbConfig";

const pbConfig = basePbConfig;

pbConfig.name = "HNI-scantrad";
pbConfig.description = "Extension that pulls manga from HNI-scantrad.";
pbConfig.language = "en";
pbConfig.icon = "icon.png";
pbConfig.contentRating = ContentRating.EVERYONE;
pbConfig.badges = []

export default pbConfig;
