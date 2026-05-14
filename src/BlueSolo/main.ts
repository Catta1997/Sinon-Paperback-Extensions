import FansubGeneral from "../FansubGeneric/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://bluesolo.org/api";

class BlueSoloExtension extends FansubGeneral {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
    });
  }
}

export const BlueSolo = new BlueSoloExtension();
