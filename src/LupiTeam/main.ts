import FansubGeneral from "../FansubGeneric/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://lupiteam.net/api";

class LupiTeamExtension extends FansubGeneral {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
        });
    }
}

export const LupiTeam = new LupiTeamExtension();
