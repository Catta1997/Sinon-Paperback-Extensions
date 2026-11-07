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
import {
  capitalLetter,
  getDefaultMetadata,
  getLanguageOptions,
  getTypeOptions,
  normalizeLanguageSelection,
  type LanguageStatus,
  type SearchMetadata,
} from "../utils";
import { type FilterKey, filterKeys, typeFilter } from "../models";

// E-Hentai rejects page ranges that are too narrow
const MIN_MAX_PAGES = 10;
const MIN_PAGE_GAP = 20;
const MAX_PAGES_LIMIT = 999;

/** Selector name prefix -> form method that handles it (see onValueChangeLabelProxy). */
const PROXY_HANDLERS = {
  onSelect_: "onChange",
  handle_: "onHandle",
  onDelete_: "onDelete",
} as const;

function matchProxyHandler(p: string | symbol) {
  if (typeof p !== "string") return undefined;
  for (const [prefix, method] of Object.entries(PROXY_HANDLERS)) {
    if (p.startsWith(prefix)) return { method, rowId: p.slice(prefix.length) };
  }
  return undefined;
}

class EHentaiAdvancedSearchForm extends AdvancedSearchForm {
  onValueChangeLabelProxy = new Proxy(this, {
    has(target, p) {
      return matchProxyHandler(p) !== undefined ? true : Object.hasOwn(target, p);
    },

    get(target, p) {
      const handler = matchProxyHandler(p);
      if (handler) {
        const fn = target[handler.method] as (rowId: string, value?: any) => Promise<void>;
        return async (value?: any) => {
          await fn.call(target, handler.rowId, value);
        };
      }
      // @ts-ignore
      return target[p];
    },
  });

  private searchMetadata: SearchMetadata;
  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    this.searchMetadata = searchQuery.metadata ?? getDefaultMetadata();
  }

  /** Selector resolved dynamically by onValueChangeLabelProxy (e.g. `onDelete_artist`). */
  private proxySel(name: string): any {
    // @ts-expect-error the dynamic selector name is resolved by onValueChangeLabelProxy
    return Application.Selector(this.onValueChangeLabelProxy, name);
  }

  private getList(type: string): string[] | undefined {
    return this.searchMetadata[type as FilterKey];
  }

  private getPageRangeError(): string | undefined {
    const { minPages, maxPages } = this.searchMetadata;
    if (maxPages && maxPages < MIN_MAX_PAGES) {
      return `Invalid maximum page value: The maximum number of pages cannot be below ${MIN_MAX_PAGES}`;
    }
    if (minPages && maxPages && maxPages - minPages < MIN_PAGE_GAP) {
      return `Invalid page range: the maximum number of pages must be at least ${MIN_PAGE_GAP} greater than the minimum.`;
    }
    return undefined;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }

  override async formDidSubmit(): Promise<void> {
    const error = this.getPageRangeError();
    if (error) throw new Error(error);
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
        onDeletion: this.proxySel(`onDelete_${filter}`),
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
        options: getTypeOptions(),
        onValueChange: Application.Selector(this as EHentaiAdvancedSearchForm, "handleTypeChange"),
      }),
    ];
  }

  getLanguageFilter(): FormItemElement<unknown>[] {
    const items = getLanguageOptions();
    return [
      TriStateSelectRow("language", {
        layout: "list",
        title: "Content languages",
        subtitle: "Select the language(s) to include/exlude in search results",
        value: this.searchMetadata.language ?? {},
        allowExclusion: true,
        allowEmptySelection: false,
        maximum: items.length,
        items,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleLanguagesChange",
        ),
      }),
    ];
  }

  getInputFilter(type: FilterKey): FormItemElement<unknown>[] {
    return [
      InputRow(type, {
        title: `Add filter`,
        value: "",
        onValueChange: this.proxySel(`handle_${type}`),
      }),
      ...(this.getList(type)?.map((value, index) =>
        InputRow(`${type}${index}`, {
          title: `${type} Filter ${index + 1}`,
          value: value,
          onValueChange: this.proxySel(`onSelect_${index}_${type}`),
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
    const { minPages, maxPages } = this.searchMetadata;
    return [
      StepperRow(`minPages`, {
        title: "Minimum content pages",
        value: minPages ?? 0,
        minValue: 0,
        maxValue: maxPages ? maxPages - MIN_PAGE_GAP : MAX_PAGES_LIMIT,
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
    const error = this.getPageRangeError();
    return [
      StepperRow(`maxPages`, {
        title: "Maximum content pages",
        value: this.searchMetadata.maxPages ?? 0,
        minValue: 0,
        maxValue: MAX_PAGES_LIMIT,
        stepValue: 1,
        loopOver: false,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleMaxPagesChange",
        ),
      }),
      LabelRow("error", {
        title: "Error",
        value: error ?? "",
        isHidden: !error,
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
      this.searchMetadata[key] = [...(this.searchMetadata[key] ?? []), value];
    }
  }

  async onChange(rowId: string, value: string): Promise<void> {
    const [indexStr, type] = rowId.split("_");
    if (!indexStr || !type) return;
    const index = Number(indexStr);
    const list = this.getList(type);
    if (!list || isNaN(index)) return;
    if (value.length > 0) list[index] = value;
    else list.splice(index, 1);
  }

  async onDelete(type: string, value: number): Promise<void> {
    const list = this.getList(type);
    if (!list || isNaN(value)) return;
    list.splice(value - 1, 1);
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.searchMetadata.type = value;
  }

  async handleLanguagesChange(value: LanguageStatus): Promise<void> {
    this.searchMetadata.language = normalizeLanguageSelection(
      this.searchMetadata.language ?? { all: "included" },
      value,
    );
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
