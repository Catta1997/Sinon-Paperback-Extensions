import {
  AdvancedSearchForm,
  type FormItemElement,
  type FormSectionElement,
  type Metadata,
  type SearchQuery,
  Section,
  SelectRow,
  SelectSection,
  TriStateSelectRow,
} from "@paperback/types";
import type { BaseMetadata, TagMap } from "./models";
import { MangaDot } from "./main";

class MangaDotAdvancedSearchForm extends AdvancedSearchForm {
  override getSearchQueryMetadata(): Metadata {
    return this.searchMetadata;
  }
  private genreFilter: string[];
  private searchMetadata: BaseMetadata;
  constructor(searchQuery: SearchQuery<BaseMetadata>, filters: string[]) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = {
        genres: {},
      };
    }
    this.genreFilter = filters;
    console.log(this.genreFilter.join("_"));
  }
  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", this.getGenresFilter()),
      Section("status", this.getStatusFilter()),
      Section("origin", this.getOriginFilter()),
    ];
  }
  getGenresFilter(): FormItemElement<unknown>[] {
    return [
      TriStateSelectRow("genres", {
        title: "Genres",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleGenres"),
        items: this.genreFilter.map((elem) => ({
          id: elem.replaceAll(" ", "#").replaceAll("-", "@").replaceAll("'", "&"),
          title: elem,
        })),
        subtitle: "",
        value: this.searchMetadata.genres ?? {},
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      }),
    ];
  }
  getStatusFilter(): FormItemElement<unknown>[] {
    return [
      TriStateSelectRow("status", {
        title: "Status",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleStatus"),
        items: MangaDot.filters.status,
        subtitle: "",
        value: this.searchMetadata.status ?? {},
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      }),
    ];
  }
  getOriginFilter(): FormItemElement<unknown>[] {
    return [
      TriStateSelectRow("origin", {
        title: "Origin",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleOrigin"),
        items: MangaDot.filters.origin,
        subtitle: "",
        value: this.searchMetadata.origin ?? {},
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      }),
    ];
  }
  async handleGenres(value: TagMap): Promise<void> {
    this.searchMetadata.genres = value;
  }
  async handleStatus(value: TagMap): Promise<void> {
    this.searchMetadata.status = value;
  }
  async handleOrigin(value: TagMap): Promise<void> {
    this.searchMetadata.origin = value;
  }
}

export default MangaDotAdvancedSearchForm;
