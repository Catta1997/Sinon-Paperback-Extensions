import FansubGeneral from "../FansubGeneric/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://ddt.hastateam.com/api";

class HastaTeamDDTExtension extends FansubGeneral {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
        });
    }
}

export const HastaTeamDDT = new HastaTeamDDTExtension();
