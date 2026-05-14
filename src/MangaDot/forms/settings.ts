import { Form, Section, SelectRow, StepperRow, ToggleRow } from "@paperback/types";
import { MangaDot } from "../main";
import { deNormalizeId, getContentTypes, normalizeId } from "../utils";

export class SettingsForm extends Form {
  override getSections() {
    const types = MangaDot.filters?.origin ?? [];
    const genres = MangaDot.filters?.genres ?? [];

    return [
      Section(
        {
          id: "update_settings",
          footer: "Filter Settings",
        },
        [
          SelectRow("type", {
            title: "Content Type",
            subtitle: "Default value for contents",
            value: getContentTypes(),
            options: types,
            minItemCount: 0,
            maxItemCount: types.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleHideTypeStatusChange"),
          }),
          SelectRow("hide_genres", {
            title: "Hide Genres",
            subtitle: "Default value for contents",
            value: this.getHideGenresStatus(),
            options: genres,
            minItemCount: 0,
            maxItemCount: genres.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideGenresStatusChange",
            ),
          }),
        ],
      ),
    ];
  }
  public async updateValue<T>(value: T, filter: string): Promise<void> {
    Application.setState(value, filter);
    this.reloadForm();
  }

  getHideGenresStatus(): string[] {
    return (Application.getState("_genres") as string[] | undefined) ?? [];
  }

  async handleHideTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_type");
  }
  async handleHideGenresStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_genres");
  }
}
