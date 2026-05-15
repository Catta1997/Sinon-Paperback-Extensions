import { Form, Section, SelectRow, StepperRow, ToggleRow } from "@paperback/types";
import { MangaDot } from "../main";
import {
  deNormalizeId,
  getContentTypes,
  getGenresHidden,
  getSectionContentTypes,
  getShowAdultStatus,
  normalizeId,
} from "../utils";

export class SettingsForm extends Form {
  override getSections() {
    const types = MangaDot.filters?.origin ?? [];
    const genres = MangaDot.filters?.genres ?? [];

    return [
      Section(
        {
          id: "update_settings",
          footer: "Default Search Filter",
        },
        [
          SelectRow("type", {
            title: "Content Type",
            subtitle: "This settings only as default search filter",
            value: getContentTypes(),
            options: types,
            minItemCount: 0,
            maxItemCount: types.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleTypeStatusChange"),
          }),
          SelectRow("hide_genres", {
            title: "Hide Genres",
            subtitle: "Default value for contents",
            value: getGenresHidden(),
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
      Section(
        {
          id: "section_settings",
          footer: "Sections Settings",
        },
        [
          SelectRow("section_type", {
            title: "Content Type",
            subtitle: "This settings apply on sections only",
            value: getSectionContentTypes(),
            options: types,
            minItemCount: 0,
            maxItemCount: types.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleSectionTypeStatusChange",
            ),
          }),
          ToggleRow("toggle_adult", {
            title: "Show Adult result on sections",
            value: getShowAdultStatus(),
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleShowAdultStatusChange",
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
  async handleShowAdultStatusChange(value: boolean): Promise<void> {
    await this.updateValue(value, "_adult");
  }
  async handleTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_type");
  }
  async handleSectionTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_sectionType");
  }
  async handleHideGenresStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_genres");
  }
}
