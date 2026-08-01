import { EHentaiGeneralExtension } from "../EHentaiGeneral/main";
class ExHentaiExtension extends EHentaiGeneralExtension {
  constructor() {
    super("https://exhentai.org", true);
  }
}

export const ExHentai = new ExHentaiExtension();
