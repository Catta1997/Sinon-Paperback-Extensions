import {
  AdvancedSearchForm,
  type FormItemElement,
  type FormSectionElement,
  type SearchQuery,
  Section,
  SelectRow,
  TriStateSelectRow,
} from "@paperback/types";
import type { NovelBuddySearchMetadata } from "./models";
import { CONTENT_TYPE, DEMOGRAPHIC, GENRES, STATUS } from "./filters";

class NovelBuddyAdvancedSearchForm extends AdvancedSearchForm {
  private searchMetadata: NovelBuddySearchMetadata;
  constructor(searchQuery: SearchQuery<NovelBuddySearchMetadata>) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = {};
    }
  }
  override getSearchQueryMetadata(): NovelBuddySearchMetadata {
    return this.searchMetadata;
  }
  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", this.getGenresFilter()),
      Section("status", this.getStatusFilter()),
      Section("type", this.getTypeFilter()),
      Section("demographic", this.getDemographicFilter()),
    ];
  }
  getTypeFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("types", {
        title: "Type",
        subtitle: "Select the type to include in search results",
        value: this.searchMetadata.type ? this.searchMetadata.type : [""],
        minItemCount: 1,
        maxItemCount: 1,
        options: CONTENT_TYPE.map((x) => ({ id: x.id, title: x.value })),
        onValueChange: Application.Selector(
          this as NovelBuddyAdvancedSearchForm,
          "handleTypeChange",
        ),
      }),
    ];
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.searchMetadata.type = value;
  }

  getDemographicFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("demographic", {
        title: "Demographic",
        subtitle: "Select the demographic genre(s) to include in search results",
        value: this.searchMetadata.demographic ? this.searchMetadata.demographic : [""],
        minItemCount: 1,
        maxItemCount: DEMOGRAPHIC.length,
        options: DEMOGRAPHIC.map((x) => ({ id: x.id, title: x.value })),
        onValueChange: Application.Selector(
          this as NovelBuddyAdvancedSearchForm,
          "handleDemographicChange",
        ),
      }),
    ];
  }

  async handleDemographicChange(value: string[]): Promise<void> {
    this.searchMetadata.demographic = value;
  }

  getStatusFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("status", {
        title: "Status",
        subtitle: "Select the status to include in search results",
        value: this.searchMetadata.status ? this.searchMetadata.status : [""],
        minItemCount: 1,
        maxItemCount: 1,
        options: STATUS.map((x) => ({ id: x.id, title: x.value })),
        onValueChange: Application.Selector(
          this as NovelBuddyAdvancedSearchForm,
          "handleStatusChange",
        ),
      }),
    ];
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.searchMetadata.status = value;
  }

  getGenresFilter(): FormItemElement<unknown>[] {
    return [
      TriStateSelectRow("genres", {
        layout: "list",
        title: "Genre",
        subtitle: "Select the genre(s) to include in search results",
        value: this.searchMetadata.genres ? this.searchMetadata.genres : {},
        allowEmptySelection: true,
        allowExclusion: true,
        items: GENRES.map((x) => ({ id: x.id, title: x.value })),
        onValueChange: Application.Selector(
          this as NovelBuddyAdvancedSearchForm,
          "handleGenreChange",
        ),
      }),
    ];
  }

  async handleGenreChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.searchMetadata.genres = value;
  }
}
export default NovelBuddyAdvancedSearchForm;
