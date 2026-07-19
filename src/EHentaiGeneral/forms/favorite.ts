import { Form, SelectSection } from "@paperback/types";

export class FavoriteForm extends Form {
  favs: { id: string; title: string }[];
  selected: string[];
  mangaid = "";
  hasFav = false;
  constructor(
    favs: { id: string; value: string }[],
    selected: { id: string; value: string },
    mangaid: string,
  ) {
    super();
    this.favs = favs.map((fav) => ({ id: fav.id, title: fav.value }));
    this.selected = selected.id !== "" ? [selected.id] : [];
    this.hasFav = selected.id !== "";
    this.mangaid = mangaid;
  }
  override requiresExplicitSubmission = true;
  override async formDidSubmit(): Promise<void> {
    const favcat = this.selected[0].split("favcat=")[1];
    const [gid, t] = this.mangaid.split("/");
    let body = "";
    if (this.selected[0] === "removeFav") {
      body = `favcat=favdel&favnote=&apply=Apply+Changes&update=1`;
    } else {
      body = `favcat=${favcat}&favnote=&apply=Add+to+Favorites&update=1`;
    }
    await Application.scheduleRequest({
      url: `https://e-hentai.org/gallerypopups.php?gid=${gid}&t=${t}&act=addfav`,
      method: "POST",
      body: body,
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
        items: !this.hasFav
          ? this.favs
          : [...this.favs, { id: "removeFav", title: "Remove Favorite" }],
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
