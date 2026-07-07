import { Form, Section, SelectRow, SelectSection } from "@paperback/types";

export class FavoriteForm extends Form {
  favs: { id: string; value: string }[];
  selected: string[];
  mangaid = "";
  constructor(
    favs: { id: string; value: string }[],
    selected: { id: string; value: string },
    mangaid: string,
  ) {
    super();
    this.favs = favs;
    this.selected = selected.id !== "" ? [selected.id] : [];
    this.mangaid = mangaid;
  }
  override requiresExplicitSubmission = true;
  override async formDidSubmit(): Promise<void> {
    const favcat = this.selected[0].split("favcat=")[1];
    const [gid, t] = this.mangaid.split("/");
    await Application.scheduleRequest({
      url: `https://e-hentai.org/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
      method: "POST",
      body: `favcat=${favcat}&favnote=&apply=Add+to+Favorites&update=1`,
    });
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }
  override getSections() {
    return [
      SelectSection(this, {
        id: "favsList",
        header: "Favorite",
        layout: "list",
        items: this.favs.map((fav) => ({ id: fav.id, title: fav.value })),
        value: this.selected,
        minItemCount: 0,
        maxItemCount: 1,
      }),
    ];
  }

  async getFavHandle(value: string[]): Promise<void> {
    const favcat = value[0].split("favcat=")[1];
    const [gid, t] = this.mangaid.split("/");
    await Application.scheduleRequest({
      url: `https://e-hentai.org/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
      method: "POST",
      body: `favcat=${favcat}&favnote=&apply=Add+to+Favorites&update=1`,
    });
    this.reloadForm();
    Application.invalidateDiscoverSections();
  }
}
