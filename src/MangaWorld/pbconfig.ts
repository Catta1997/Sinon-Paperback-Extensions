import { ContentRating } from "@paperback/types";
import { basePbConfig } from "../MangaWorldGeneric/basePbConfig";

const pbConfig = basePbConfig;

pbConfig.name = "MangaWorld";
pbConfig.description = "Extension that pulls manga from MangaWorld.";
pbConfig.language = "it";
pbConfig.icon = "icon.png";
pbConfig.contentRating = ContentRating.EVERYONE;

export default pbConfig;
