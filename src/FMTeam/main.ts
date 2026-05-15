import FansubGeneral from "../FansubGeneric/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://fmteam.fr/api";

class FMTeamExtension extends FansubGeneral {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      english: true
    });
  }
}

export const FMTeam = new FMTeamExtension();
