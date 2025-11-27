import PhoenixTAMGeneral from "../FansubGeneral/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://lupiteam.net/api";

class LupiTeamExtension extends PhoenixTAMGeneral {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
        });
    }
}

export const LupiTeam = new LupiTeamExtension();
