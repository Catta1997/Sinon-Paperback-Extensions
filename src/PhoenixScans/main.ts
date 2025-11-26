import PhoenixTAMGeneral from "../PhoenixTAMGeneral/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://phoenixscans.com/api";

class PhoenixScansExtension extends PhoenixTAMGeneral {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
        });
    }
}

export const PhoenixScans = new PhoenixScansExtension();
