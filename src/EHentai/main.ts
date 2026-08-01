import { EHentaiGeneralExtension } from "../EHentaiGeneral/main";
class EHentaiExtension extends EHentaiGeneralExtension {
  constructor() {
    super("https://e-hentai.org", false);
  }
}

export const EHentai = new EHentaiExtension();
