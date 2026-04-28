import {
  Form,
  Section,
  SelectRow,
  type FormSectionElement,
  StepperRow,
  ToggleRow,
  type SearchQuery,
  AdvancedSearchForm,
  type FormItemElement,
  InputRow,
  LabelRow,
} from "@paperback/types";
import { languageFilter, type SearchMetadata, typeFilter } from "./utils";
import { mainRateLimiter } from "./network";

export class EHentaiAdvancedSearchForm extends AdvancedSearchForm {
  onSelectLabelProxy = new Proxy(this, {
    has(target, p) {
      if (typeof p == "string" && p.startsWith("onSelect_")) {
        return true;
      } else {
        return Object.hasOwn(target, p);
      }
    },
    get(target, p) {
      if (typeof p == "string" && p.startsWith("onSelect_")) {
        const rowId = p.slice(9);
        return async () => {
          await target["onSelect"](rowId);
        };
      } else {
        // @ts-ignore
        return target[p];
      }
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
          id: "male",
          footer: "Tap an added filter to remove it",
        },
        this.getMaleFilter(),
      ),
      Section(
        {
          id: "female",
          footer: "Tap an added filter to remove it",
        },
        this.getFemaleFilter(),
      ),
      Section(
        {
          id: "character",
          footer: "Tap an added filter to remove it",
        },
        this.getCharacterFilter(),
      ),
      Section(
        {
          id: "other",
          footer: "Tap an added filter to remove it",
        },
        this.getOtherFilter(),
      ),
      Section(
        {
          id: "parody",
          footer: "Tap an added filter to remove it",
        },
        this.getParodyFilter(),
      ),
      Section(
        {
          id: "author",
          footer: "Tap an added filter to remove it",
        },
        this.getAuthorFilter(),
      ),
      Section(
        {
          id: "mixed",
          footer: "Tap an added filter to remove it",
        },
        this.getMixedFilter(),
      ),
      //Section("minPagesFilter", this.getMinPagesFilter()),
      //Section("maxPagesFilter", this.getMaxPagesFilter()),
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
  getMaleFilter(): FormItemElement<unknown>[] {
    return [
      InputRow(`male`, {
        title: "Add male filter",
        value: "",
        onValueChange: Application.Selector(this as EHentaiAdvancedSearchForm, "handleMaleChange"),
      }),
      ...(this.searchMetadata.male?.map((value, indice) =>
        LabelRow(`male${indice}`, {
          title: `Male Filter ${indice + 1}`,
          value: value,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, `onSelect_${indice}_male`),
        }),
      ) ?? []),
    ];
  }
  getFemaleFilter(): FormItemElement<unknown>[] {
    return [
      InputRow(`female`, {
        title: "Add female filter",
        value: "",
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleFemaleChange",
        ),
      }),
      ...(this.searchMetadata.female?.map((value, indice) =>
        LabelRow(`female${indice}`, {
          title: `Female Filter ${indice + 1}`,
          value: value,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, `onSelect_${indice}_female`),
        }),
      ) ?? []),
    ];
  }
  getCharacterFilter(): FormItemElement<unknown>[] {
    return [
      InputRow(`character`, {
        title: "Add character filter",
        value: "",
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleCharacterChange",
        ),
      }),
      ...(this.searchMetadata.character?.map((value, indice) =>
        LabelRow(`character${indice}`, {
          title: `Character Filter ${indice + 1}`,
          value: value,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, `onSelect_${indice}_character`),
        }),
      ) ?? []),
    ];
  }
  getOtherFilter(): FormItemElement<unknown>[] {
    return [
      InputRow(`other`, {
        title: "Add other filter",
        value: "",
        onValueChange: Application.Selector(this as EHentaiAdvancedSearchForm, "handleOtherChange"),
      }),
      ...(this.searchMetadata.other?.map((value, indice) =>
        LabelRow(`other${indice}`, {
          title: `Other Filter ${indice + 1}`,
          value: value,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, `onSelect_${indice}_other`),
        }),
      ) ?? []),
    ];
  }
  getParodyFilter(): FormItemElement<unknown>[] {
    return [
      InputRow(`parody`, {
        title: "Add parody filter",
        value: "",
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleParodyChange",
        ),
      }),
      ...(this.searchMetadata.parody?.map((value, indice) =>
        LabelRow(`parody${indice}`, {
          title: `Parody Filter ${indice + 1}`,
          value: value,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, `onSelect_${indice}_parody`),
        }),
      ) ?? []),
    ];
  }
  getAuthorFilter(): FormItemElement<unknown>[] {
    return [
      InputRow(`author`, {
        title: "Add author filter",
        value: "",
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleAuthorChange",
        ),
      }),
      ...(this.searchMetadata.author?.map((value, indice) =>
        LabelRow(`author${indice}`, {
          title: `Author Filter ${indice + 1}`,
          value: value,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, `onSelect_${indice}_author`),
        }),
      ) ?? []),
    ];
  }
  getMixedFilter(): FormItemElement<unknown>[] {
    return [
      InputRow(`mixed`, {
        title: "Add mixed filter",
        value: "",
        onValueChange: Application.Selector(this as EHentaiAdvancedSearchForm, "handleMixedChange"),
      }),
      ...(this.searchMetadata.mixed?.map((value, indice) =>
        LabelRow(`mixed${indice}`, {
          title: `Mixed Filter ${indice + 1}`,
          value: value,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, `onSelect_${indice}_mixed`),
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
  async onSelect(rowId: string): Promise<void> {
    const [index, type] = rowId.split("_");
    switch (type) {
      case "male":
        this.searchMetadata.male!.splice(Number(index), 1);
        break;
      case "female":
        this.searchMetadata.female!.splice(Number(index), 1);
        break;
      case "other":
        this.searchMetadata.other!.splice(Number(index), 1);
        break;
      case "parody":
        this.searchMetadata.parody!.splice(Number(index), 1);
        break;
      case "character":
        this.searchMetadata.character!.splice(Number(index), 1);
        break;
      case "author":
        this.searchMetadata.author!.splice(Number(index), 1);
        break;
      case "mixed":
        this.searchMetadata.mixed!.splice(Number(index), 1);
        break;
    }
  }
  getMinPagesFilter(): FormItemElement<unknown>[] {
    return [
      StepperRow(`minPages`, {
        title: "Min Pages",
        value: this.searchMetadata.minPages ?? 0,
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
        minValue: this.searchMetadata.minPages ? this.searchMetadata.minPages + 20 : 0,
        maxValue: 1000,
        stepValue: 1,
        loopOver: false,
        onValueChange: Application.Selector(
          this as EHentaiAdvancedSearchForm,
          "handleMaxPagesChange",
        ),
      }),
    ];
  }
  async handleTypeChange(value: string[]): Promise<void> {
    this.searchMetadata.type = value;
  }
  async handleLanguagesChange(value: string[]): Promise<void> {
    this.searchMetadata.language = value;
  }
  async handleMaleChange(value: string): Promise<void> {
    let males = this.searchMetadata.male ?? [];
    males.push(value);
    this.searchMetadata.male = males;
  }
  async handleFemaleChange(value: string): Promise<void> {
    let females = this.searchMetadata.female ?? [];
    females.push(value);
    this.searchMetadata.female = females;
  }
  async handleCharacterChange(value: string): Promise<void> {
    let characters = this.searchMetadata.character ?? [];
    characters.push(value);
    this.searchMetadata.character = characters;
  }
  async handleOtherChange(value: string): Promise<void> {
    let others = this.searchMetadata.other ?? [];
    others.push(value);
    this.searchMetadata.other = others;
  }
  async handleParodyChange(value: string): Promise<void> {
    let parody = this.searchMetadata.parody ?? [];
    parody.push(value);
    this.searchMetadata.parody = parody;
  }
  async handleAuthorChange(value: string): Promise<void> {
    let author = this.searchMetadata.author ?? [];
    author.push(value);
    this.searchMetadata.author = author;
  }
  async handleMixedChange(value: string): Promise<void> {
    let mixed = this.searchMetadata.mixed ?? [];
    mixed.push(value);
    this.searchMetadata.mixed = mixed;
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

export class Forms extends Form {
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
            onValueChange: Application.Selector(this as Forms, "handleHideTypeStatusChange"),
          }),
          StepperRow("rate_limit", {
            title: "Rate Limit",
            subtitle: "Set Custom Rate Limit",
            value: this.getRateFormsValue(),
            minValue: 9,
            maxValue: 100,
            stepValue: 1,
            loopOver: true,
            onValueChange: Application.Selector(this as Forms, "handleRateStatusChange"),
          }),
          ToggleRow("tl_link", {
            title: "Use Secondary Image Link",
            subtitle:
              "Use every time the second available image link (chapter image load will be slower)",
            value: this.getRateNLValue(),
            onValueChange: Application.Selector(this as Forms, "handleNLStatusChange"),
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

  getRateNLValue(): boolean {
    return (Application.getState("nlLink") as boolean | undefined) ?? false;
  }

  async handleNLStatusChange(value: boolean): Promise<void> {
    await this.updateValue(value, "nlLink");
  }
}
