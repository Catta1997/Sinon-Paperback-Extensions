import {
  AdvancedSearchForm,
  type FormItemElement,
  type FormSectionElement,
  InputRow,
  type SearchQuery,
  Section,
  SelectRow,
  StepperRow,
} from "@paperback/types";
import { type FilterKey, languageFilter, type SearchMetadata, typeFilter } from "../utils";

export class EHentaiAdvancedSearchForm extends AdvancedSearchForm {
  onValueChangeLabelProxy = new Proxy(this, {
    has(target, p) {
      return typeof p === "string" && (p.startsWith("onSelect_") || p.startsWith("handle_"))
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
        language: [],
        male: [],
        female: [],
        character: [],
        other: [],
        parody: [],
        author: [],
        mixed: [],
      };
    }
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }
  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("type", this.getTypeFilter()),
      Section("language", this.getLanguageFilter()),
      Section("rating", this.getRatingFilter()),
      Section(
        {
          header: "Male",
          id: "male",
          footer: "Add '-' before the filter to exclude it",
        },
        this.getInputFilter("male"),
      ),
      Section(
        {
          header: "Female",
          id: "female",
          footer: "Add '-' before the filter to exclude it",
        },
        this.getInputFilter("female"),
      ),
      Section(
        {
          header: "Character",
          id: "character",
          footer: "Add '-' before the filter to exclude it",
        },
        this.getInputFilter("character"),
      ),
      Section(
        {
          header: "Other",
          id: "other",
          footer: "Add '-' before the filter to exclude it",
        },
        this.getInputFilter("other"),
      ),
      Section(
        {
          header: "Parody",
          id: "parody",
          footer: "Add '-' before the filter to exclude it",
        },
        this.getInputFilter("parody"),
      ),
      Section(
        {
          header: "Author",
          id: "author",
          footer: "Add '-' before the filter to exclude it",
        },
        this.getInputFilter("author"),
      ),
      Section(
        {
          header: "Mixed",
          id: "mixed",
          footer: "Add '-' before the filter to exclude it",
        },
        this.getInputFilter("mixed"),
      ),
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
        maxItemCount: 1,
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
        subtitle: "Minimum Value: 10",
        minValue: 10,
        maxValue: this.searchMetadata.maxPages ? this.searchMetadata.maxPages : 1000,
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
    return [
      StepperRow(`maxPages`, {
        title: "Max Pages",
        value: this.searchMetadata.maxPages ?? 0,
        subtitle: "Minimum Value: minimum pages + 20",
        minValue: 0,
        maxValue: 200,
        stepValue: 1,
        loopOver: false,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleMaxPagesChange",
        ),
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
    if (!arr) return;
    value.length ? (arr[index] = value) : arr.splice(index, 1);
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
