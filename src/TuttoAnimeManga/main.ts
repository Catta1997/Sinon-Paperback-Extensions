import FansubGeneral from "../FansubGeneric/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://tuttoanimemanga.net/api";

class TuttoAnimeMangaExtension extends FansubGeneral {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
    });
  }
}

export const TuttoAnimeManga = new TuttoAnimeMangaExtension();
