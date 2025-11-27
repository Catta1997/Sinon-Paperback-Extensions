import { ContentRating } from "@paperback/types";
import { basePbConfig } from "../MangaWorldGeneric/basePbConfig";

const pbConfig = basePbConfig;

pbConfig.name = "MangaWorldAdult";
pbConfig.description = "Extension that pulls manga from MangaWorldAdult.";
pbConfig.language = "it";
pbConfig.icon = "icon.png";
pbConfig.contentRating = ContentRating.ADULT;

export default pbConfig;
