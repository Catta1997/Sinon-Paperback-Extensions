import FansubGeneral from "../FansubGeneric/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://phoenixscans.com/api";

class PhoenixScansExtension extends FansubGeneral {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
    });
  }
}

export const PhoenixScans = new PhoenixScansExtension();
