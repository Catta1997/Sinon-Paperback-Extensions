import { typeFilter } from "../utils";
import { Form, Section, SelectRow, StepperRow } from "@paperback/types";
import { mainRateLimiter } from "../network";

export class SettingsForm extends Form {
  override getSections() {
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
            onValueChange: Application.Selector(this as SettingsForm, "handleHideTypeStatusChange"),
          }),
          StepperRow("rate_limit", {
            title: "Rate Limit",
            subtitle: "Set Custom Rate Limit",
            value: this.getRateFormsValue(),
            minValue: 9,
            maxValue: 100,
            stepValue: 1,
            loopOver: true,
            onValueChange: Application.Selector(this as SettingsForm, "handleRateStatusChange"),
          }),
        ],
      ),
    ];
  }
  public async updateValue<T>(value: T, filter: string): Promise<void> {
    Application.setState(value, filter);
    this.reloadForm();
  }

  getHideTypeStatus(): string[] {
    return (Application.getState("_type") as string[] | undefined) ?? [];
  }

  async handleHideTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "_type");
    // Application.invalidateSearchFilters();
  }

  getRateFormsValue(): number {
    return (
      (Application.getState("RateFilter") as number | undefined) ??
      mainRateLimiter.options.numberOfRequests.valueOf()
    );
  }

  async handleRateStatusChange(value: number): Promise<void> {
    await this.updateValue(value, "RateFilter");
    mainRateLimiter.options.numberOfRequests = value;
  }
}
