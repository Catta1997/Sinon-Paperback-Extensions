import FansubGeneral from "../FansubGeneric/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://reader.hastateam.com/api";

class HastaTeamExtension extends FansubGeneral {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
    });
  }
}

export const HastaTeam = new HastaTeamExtension();
