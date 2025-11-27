import PhoenixTAMGeneral from "../FansubGeneral/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://reader.gtothegreatsite.net/api";

class GTOTheGreatSiteExtension extends PhoenixTAMGeneral {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
        });
    }
}

export const GTOTheGreatSite = new GTOTheGreatSiteExtension();
