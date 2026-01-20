import { Form, Section, SelectRow, type FormSectionElement } from "@paperback/types";
import { typeFilter } from "./utils";

export class Forms extends Form {
  override getSections(): FormSectionElement[] {
    const types: { id: string; title: string }[] = typeFilter.map((tag) => ({
      id: tag.id,
      title: tag.value,
    }));

    return [
      Section(
        {
          id: "update_settings",
          footer: "Filter Settings",
        },
        [
          SelectRow("hide_type", {
            title: "Contents",
            subtitle: "Default value for contents",
            value: this.getHideTypeStatus(),
            options: types,
            minItemCount: 1,
            maxItemCount: types.length,
            onValueChange: Application.Selector(this as Forms, "handleHideTypeStatusChange"),
          }),
        ],
      ),
    ];
  }
  public async updateValue(value: string[], filter: string): Promise<void> {
    Application.setState(value, filter);
    Application.invalidateSearchFilters();
    this.reloadForm();
  }

  getHideTypeStatus(): string[] {
    return (Application.getState("_type") as string[] | undefined) ?? [];
  }

  async handleHideTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_type");
  }

  getLanguageFormsValue(): string[] {
    return (Application.getState("_languageFilter") as string[] | undefined) ?? [];
  }

  async handleFilterStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_languageFilter");
  }
}
