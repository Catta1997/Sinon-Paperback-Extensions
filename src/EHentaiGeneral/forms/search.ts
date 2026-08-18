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
  ToggleRow,
  TriStateSelectRow,
} from "@paperback/types";
import { capitalLetter, getDefaultMetadata, getLanguages, type SearchMetadata } from "../utils";
import { type FilterKey, filterKeys, typeFilter } from "../models";

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
      this.searchMetadata = getDefaultMetadata();
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
        header: capitalLetter(filter),
        allowAddition: false,
        allowDeletion: true,
        allowReorder: false,
        id: `${filter}`,
        footer: "Use `-` to exclude a tag",
        onDeletion: Application.Selector(
          this.onValueChangeLabelProxy,
          // @ts-expect-error
          `onDelete_${filter}`,
        ),
        items: this.getInputFilter(filter),
      }),
    );
    return [
      Section({ id: "type", header: "Type" }, this.getTypeFilter()),
      Section({ id: "language", header: "Language" }, this.getLanguageFilter()),
      Section({ id: "rating", header: "Minimum Rating" }, this.getRatingFilter()),
      Section({ id: "minPagesFilter", header: "Minimum Pages" }, this.getMinPagesFilter()),
      Section({ id: "maxPagesFilter", header: "Maximum Pages" }, this.getMaxPagesFilter()),
      Section({ id: "expunged", header: "Expunged Galleries" }, this.getExpungedFilter()),
      ...inputSections,
    ];
  }
  getTypeFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("genres", {
        title: "Content type",
        subtitle: "Select the type(s) to include in search results",
        value:
          this.searchMetadata.type && this.searchMetadata.type.length > 0
            ? this.searchMetadata.type
            : typeFilter.map((x) => x.id),
        minItemCount: 1,
        maxItemCount: typeFilter.length,
        options: typeFilter.map((x) => ({ id: x.id, title: x.value })),
        onValueChange: Application.Selector(this as EHentaiAdvancedSearchForm, "handleTypeChange"),
      }),
    ];
  }
  getLanguageFilter(): FormItemElement<unknown>[] {
    return [
      TriStateSelectRow("language", {
        layout: "list",
        title: "Content languages",
        subtitle: "Select the language(s) to include/exlude in search results",
        value: this.searchMetadata.language ?? {},
        allowExclusion: true,
        allowEmptySelection: false,
        maximum: getLanguages().length,
        items: getLanguages().map((x) => ({ id: x.id, title: `${x.flag} ${x.value}` })),
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
        title: `Add filter`,
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
        title: "Minimum rating of content",
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
        title: "Minimum content pages",
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
        title: "Maximum content pages",
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
  getExpungedFilter(): FormItemElement<unknown>[] {
    return [
      ToggleRow(`expungedGalleries`, {
        title: "Browse Expunged Galleries",
        value: this.searchMetadata.expunged ?? false,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleExpungedChange",
        ),
      }),
    ];
  }
  async onHandle(type: string, value: string): Promise<void> {
    if (value.length > 0) {
      const key = type as FilterKey;
      const current = this.searchMetadata[key] ?? [];
      this.searchMetadata[key] = [...current, value];
    }
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
  async handleLanguagesChange(value: Record<string, "included" | "excluded">): Promise<void> {
    const previous = this.searchMetadata.language ?? { all: "included" };
    if (value.all === "excluded") {
      value.all = "included";
    }
    const hadAll = previous.all === "included";
    const hasAll = value.all === "included";
    if (!hadAll && hasAll) {
      value = { all: "included" };
    } else if (hadAll && hasAll && Object.keys(value).length > 1) {
      delete value.all;
    }
    if (Object.keys(value).length === 0) {
      value = { all: "included" };
    }
    this.searchMetadata.language = value;
  }
  async handleRatingChange(value: number): Promise<void> {
    this.searchMetadata.rating = value;
  }
  async handleMaxPagesChange(value: number): Promise<void> {
    this.searchMetadata.maxPages = value;
    this.reloadForm();
  }
  async handleMinPagesChange(value: number): Promise<void> {
    this.searchMetadata.minPages = value;
    this.reloadForm();
  }
  async handleExpungedChange(value: boolean): Promise<void> {
    this.searchMetadata.expunged = value;
    this.reloadForm();
  }
}

export default EHentaiAdvancedSearchForm;
