import { EHentaiGeneralExtension } from "../EHentaiGeneral/main";
class EHentaiExtension extends EHentaiGeneralExtension {
  constructor() {
    super("https://e-hentai.org");
  }
}

export const EHentai = new EHentaiExtension();
