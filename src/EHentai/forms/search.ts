import {
  AdvancedSearchForm,
  EditSection,
  type FormItemElement,
  type FormSectionElement,
  InputRow,
  LabelRow,
  type SearchQuery,
  Section,
  SelectRow,
  StepperRow,
} from "@paperback/types";
import {
  type FilterKey,
  filterKeys,
  languageFilter,
  type SearchMetadata,
  typeFilter,
} from "../utils";

class EHentaiAdvancedSearchForm extends AdvancedSearchForm {
  onValueChangeLabelProxy = new Proxy(this, {
    has(target, p) {
      return typeof p === "string" &&
        (p.startsWith("onDelete_") || p.startsWith("onSelect_") || p.startsWith("handle_"))
        ? true
        : Object.hasOwn(target, p);
    },

    get(target, p) {
      if (typeof p === "string" && p.startsWith("onSelect_")) {
        const rowId = p.slice("onSelect_".length);

        return async (value?: any) => {
          await target.onChange(rowId, value);
        };
      } else if (typeof p === "string" && p.startsWith("handle_")) {
        const rowId = p.slice("handle_".length);
        return async (value?: any) => {
          await target.onHandle(rowId, value);
        };
      } else if (typeof p === "string" && p.startsWith("onDelete_")) {
        const rowId = p.slice("onDelete_".length);
        return async (value?: any) => {
          await target.onDelete(rowId, value);
        };
      }
      // @ts-ignore
      return target[p];
    },
  });

  private searchMetadata: SearchMetadata;
  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = {
        type: (Application.getState("_type") as string[]) ?? [],
      };
    }
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }

  override async formDidSubmit(): Promise<void> {
    if (this.searchMetadata.maxPages && this.searchMetadata.maxPages < 10) {
      throw new Error("Invalid maximum page value: The maximum number of pages cannot be below 10");
    }

    if (
      this.searchMetadata.minPages &&
      this.searchMetadata.maxPages &&
      this.searchMetadata.maxPages - this.searchMetadata.minPages < 20
    ) {
      throw new Error(
        "Invalid page range: the maximum number of pages must be at least 20 greater than the minimum.",
      );
    }
  }
  override getSections(): FormSectionElement<unknown>[] {
    const inputSections = filterKeys.map((filter) =>
      EditSection(`${filter}`, {
        allowAddition: false,
        allowDeletion: true,
        allowReorder: false,
        id: `${filter}`,
        onDeletion: Application.Selector(
          this.onValueChangeLabelProxy,
          // @ts-expect-error
          `onDelete_${filter}`,
        ),
        items: this.getInputFilter(filter),
      }),
    );
    return [
      Section("type", this.getTypeFilter()),
      Section("language", this.getLanguageFilter()),
      Section("rating", this.getRatingFilter()),
      ...inputSections,
      Section("minPagesFilter", this.getMinPagesFilter()),
      Section("maxPagesFilter", this.getMaxPagesFilter()),
    ];
  }
  getTypeFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("genres", {
        title: "Type",
        subtitle: "Select the genre(s) to include in search results",
        value: this.searchMetadata.type ?? typeFilter.map((x) => x.id),
        minItemCount: 1,
        maxItemCount: typeFilter.length,
        options: typeFilter.map((x) => ({ id: x.id, title: x.value })),
        onValueChange: Application.Selector(this as EHentaiAdvancedSearchForm, "handleTypeChange"),
      }),
    ];
  }
  getLanguageFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("genres", {
        title: "Language",
        subtitle: "Select the genre(s) to include in search results",
        value: this.searchMetadata.language ?? [],
        minItemCount: 0,
        maxItemCount: languageFilter.length,
        options: languageFilter.map((x) => ({ id: x.id, title: x.value })),
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleLanguagesChange",
        ),
      }),
    ];
  }
  getInputFilter(type: FilterKey): FormItemElement<unknown>[] {
    const values = this.searchMetadata[type] as string[] | undefined;
    return [
      InputRow(type, {
        title: `Add ${type} filter`,
        value: "",
        onValueChange: Application.Selector(
          this.onValueChangeLabelProxy,
          // @ts-expect-error
          `handle_${type}`,
        ),
      }),
      ...(values?.map((value, index) =>
        InputRow(`${type}${index}`, {
          title: `${type} Filter ${index + 1}`,
          value: value,
          onValueChange: Application.Selector(
            this.onValueChangeLabelProxy,
            // @ts-expect-error
            `onSelect_${index}_${type}`,
          ),
        }),
      ) ?? []),
    ];
  }
  getRatingFilter(): FormItemElement<unknown>[] {
    return [
      StepperRow(`rating`, {
        title: "Rating",
        value: this.searchMetadata.rating ?? 0,
        minValue: 0,
        maxValue: 5,
        stepValue: 1,
        loopOver: false,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleRatingChange",
        ),
      }),
    ];
  }
  getMinPagesFilter(): FormItemElement<unknown>[] {
    return [
      StepperRow(`minPages`, {
        title: "Min Pages",
        value: this.searchMetadata.minPages ?? 0,
        minValue: 0,
        maxValue: this.searchMetadata.maxPages ? this.searchMetadata.maxPages - 20 : 999,
        stepValue: 1,
        loopOver: false,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleMinPagesChange",
        ),
      }),
    ];
  }
  getMaxPagesFilter(): FormItemElement<unknown>[] {
    const max = this.searchMetadata.maxPages ?? 0;
    const min = this.searchMetadata.minPages ?? 0;
    const range = min != 0 && max - min < 20;
    const minMaxVale = min != 0 && max < 10;
    return [
      StepperRow(`maxPages`, {
        title: "Max Pages",
        value: this.searchMetadata.maxPages ?? 0,
        minValue: 0,
        maxValue: 999,
        stepValue: 1,
        loopOver: false,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleMaxPagesChange",
        ),
      }),
      LabelRow("error", {
        title: "Error",
        value: range
          ? "Invalid page range: the maximum number " +
            "of pages must be at least 20 greater than the minimum."
          : "Invalid maximum page value: The maximum" + "number of pages cannot be below 10",
        isHidden: !range && !minMaxVale,
      }),
    ];
  }
  async onHandle(type: string, value: string): Promise<void> {
    const key = type as FilterKey;
    const current = this.searchMetadata[key] ?? [];
    this.searchMetadata[key] = [...current, value];
  }
  async onChange(rowId: string, value: string): Promise<void> {
    const [indexStr, type] = rowId.split("_");
    if (!indexStr || !type) {
      return;
    }
    const index = Number(indexStr);
    const arr = this.searchMetadata[type as keyof SearchMetadata] as string[] | undefined;
    if (!arr || isNaN(index)) return;
    const _ = value.length > 0 ? (arr[index] = value) : arr.splice(index, 1);
    return;
  }
  async onDelete(type: string, value: number): Promise<void> {
    const arr = this.searchMetadata[type as keyof SearchMetadata] as string[] | undefined;
    if (!arr || isNaN(value)) return;
    arr.splice(value - 1, 1);
    return;
  }
  async handleTypeChange(value: string[]): Promise<void> {
    this.searchMetadata.type = value;
  }
  async handleLanguagesChange(value: string[]): Promise<void> {
    this.searchMetadata.language = value;
  }
  async handleRatingChange(value: number): Promise<void> {
    this.searchMetadata.rating = value;
  }
  async handleMaxPagesChange(value: number): Promise<void> {
    this.searchMetadata.maxPages = value;
  }
  async handleMinPagesChange(value: number): Promise<void> {
    this.searchMetadata.minPages = value;
  }
}

export default EHentaiAdvancedSearchForm;
