import { MangaWorldGeneric } from "../MangaWorldGeneric/MangaWorldGeneric";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://www.mangaworld.cx";

class MangaWorldExtension extends MangaWorldGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
        });
    }
}

export const MangaWorld = new MangaWorldExtension();
