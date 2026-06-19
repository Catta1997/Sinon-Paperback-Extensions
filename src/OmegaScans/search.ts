import {
  AdvancedSearchForm,
  type FormSectionElement,
  type SearchQuery,
  SelectSection,
} from "@paperback/types";
import type { OmegaScansSearchMetadata } from "./model";
import { genres, types } from "./filters";

class OmegaScansAdvancedSearchForm extends AdvancedSearchForm {
  override getSearchQueryMetadata(): OmegaScansSearchMetadata {
    if (this.genreList.length > 0) {
      this.searchMetadata.tags_ids = this.genreList;
    }
    if (this.seriesTypeList.length > 0) {
      this.searchMetadata.series_type = this.seriesTypeList;
    }
    return this.searchMetadata;
  }

  override async formDidSubmit(): Promise<void> {
    if (this.genreList.length > 0) {
      this.searchMetadata.tags_ids = this.genreList;
    }
    if (this.seriesTypeList.length > 0) {
      this.searchMetadata.series_type = this.seriesTypeList;
    }
  }

  private searchMetadata: OmegaScansSearchMetadata;

  constructor(searchQuery: SearchQuery<OmegaScansSearchMetadata>) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = {};
    }
    this.genreList = searchQuery.metadata?.tags_ids ?? [];
    this.seriesTypeList = searchQuery.metadata?.series_type ?? [];
  }
  private genreList: string[] = [];
  private seriesTypeList: string[] = [];

  override getSections(): FormSectionElement<unknown>[] {
    return [
      SelectSection(this, {
        id: "genres",
        layout: "flow",
        value: this.genreList ?? [],
        items: genres,
        minItemCount: 0,
        maxItemCount: genres.length,
      }),
      SelectSection(this, {
        id: "type",
        layout: "flow",
        value: this.seriesTypeList ?? [],
        items: types,
        minItemCount: 0,
        maxItemCount: 1,
      }),
    ];
  }
}

export default OmegaScansAdvancedSearchForm;
