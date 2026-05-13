import {
  AdvancedSearchForm,
  type FlowSectionElement,
  type FormItemElement,
  type FormSectionElement,
  InputRow,
  type ListSectionElement,
  NavigationRow,
  type SearchQuery,
  Section,
  SelectSection,
  TriStateSelectRow,
} from "@paperback/types";
import { MangaDot } from "../main";
import {
  deNormalizeId,
  normalizeId,
  type BaseMetadata,
  type TagMap,
  getGenresHidden,
  defaultMetadata,
} from "../utils";

class MangaDotAdvancedSearchForm extends AdvancedSearchForm {
  override getSearchQueryMetadata(): BaseMetadata {
    return this.searchMetadata;
  }
  private genreFilter: { id: string; title: string }[];
  private searchMetadata: BaseMetadata;
  constructor(searchQuery: SearchQuery<BaseMetadata>, filters: { id: string; title: string }[]) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = defaultMetadata();
    }
    this.genreFilter = filters;
  }
  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", this.getGenresFilter()),
      Section("status", this.getStatusFilter()),
      Section("origin", this.getOriginFilter()),
      Section("author", [
        NavigationRow("author_filter", {
          title: "Authors",
          subtitle: this.searchMetadata.author?.flatMap(deNormalizeId).join(", ") ?? "",
          form: new AuthorFilter(this.searchMetadata),
        }),
      ]),
      Section("artist", [
        NavigationRow("artist_filter", {
          title: "Artists",
          subtitle: this.searchMetadata.artist?.flatMap(deNormalizeId).join(", ") ?? "",
          form: new ArtistFilter(this.searchMetadata),
        }),
      ]),
    ];
  }
  getGenresFilter(): FormItemElement<unknown>[] {
    return [
      TriStateSelectRow("genres", {
        title: "Genres",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleGenres"),
        items: this.genreFilter,
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
        items: MangaDot.filters?.status ?? [],
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
        items: MangaDot.filters?.origin ?? [],
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

class AuthorFilter extends AdvancedSearchForm {
  private authorMetadata: BaseMetadata;
  constructor(authorMetadata: BaseMetadata) {
    super();
    if (authorMetadata !== undefined) {
      this.authorMetadata = authorMetadata;
    } else {
      this.authorMetadata = {
        author: [],
      };
    }
    this.savedAuthorFiltered = this.authorMetadata.author ? this.authorMetadata.author : [];
  }

  override getSearchQueryMetadata(): BaseMetadata {
    if (this.savedAuthorFiltered.length > 0) {
      this.authorMetadata.author = this.savedAuthorFiltered;
    }
    return this.authorMetadata;
  }
  override async formDidSubmit(): Promise<void> {
    if (this.savedAuthorFiltered.length > 0) {
      this.authorMetadata.author = this.savedAuthorFiltered;
    }
  }
  private authorFiltered: string[] = [];
  private savedAuthorFiltered: string[] = [];
  private searchedValue: string = "";
  override getSections(): (ListSectionElement | FlowSectionElement)[] {
    return this.getAuthorFilter();
  }
  getAuthorFilter(): (ListSectionElement | FlowSectionElement)[] {
    return [
      Section("author", [
        InputRow("author", {
          title: "Search Author",
          value: this.searchedValue,
          onValueChange: Application.Selector(this as AuthorFilter, "handleAuthorLabel"),
        }),
      ]),
      ...(this.authorFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "authorSearch",
              layout: "list",
              value: this.savedAuthorFiltered ?? [],
              items: this.authorFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.authorFiltered.length,
            }),
          ]
        : []),
      ...(this.savedAuthorFiltered && this.savedAuthorFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "selections",
              layout: "list",
              value: this.savedAuthorFiltered ?? [],
              items: this.savedAuthorFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.savedAuthorFiltered.length,
            }),
          ]
        : []),
    ];
  }
  async handleAuthorLabel(value: string): Promise<void> {
    this.searchedValue = value;
    if (value.length > 2) {
      const authors = await MangaDot.api.getAuthor(value);
      this.authorFiltered = authors.suggestions;
    }
  }
}

class ArtistFilter extends AdvancedSearchForm {
  private artistMetadata: BaseMetadata;
  constructor(authorMetadata: BaseMetadata) {
    super();
    if (authorMetadata !== undefined) {
      this.artistMetadata = authorMetadata;
    } else {
      this.artistMetadata = {
        artist: [],
      };
    }
    this.savedArtistFiltered = this.artistMetadata.artist ? this.artistMetadata.artist : [];
  }

  override getSearchQueryMetadata(): BaseMetadata {
    if (this.savedArtistFiltered.length > 0) {
      this.artistMetadata.artist = this.savedArtistFiltered;
    }
    return this.artistMetadata;
  }
  override async formDidSubmit(): Promise<void> {
    if (this.savedArtistFiltered.length > 0) {
      this.artistMetadata.artist = this.savedArtistFiltered;
    }
  }
  private artistsFiltered: string[] = [];
  private savedArtistFiltered: string[] = [];
  private searchedValue: string = "";
  override getSections(): (ListSectionElement | FlowSectionElement)[] {
    return this.getAuthorFilter();
  }
  getAuthorFilter(): (ListSectionElement | FlowSectionElement)[] {
    return [
      Section("artist", [
        InputRow("artist", {
          title: "Search Artist",
          value: this.searchedValue,
          onValueChange: Application.Selector(this as ArtistFilter, "handleArtistLabel"),
        }),
      ]),
      ...(this.artistsFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "artistSearch",
              layout: "list",
              value: this.savedArtistFiltered ?? [],
              items: this.artistsFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.artistsFiltered.length,
            }),
          ]
        : []),
      ...(this.savedArtistFiltered && this.savedArtistFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "selections",
              layout: "list",
              value: this.savedArtistFiltered ?? [],
              items: this.savedArtistFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.savedArtistFiltered.length,
            }),
          ]
        : []),
    ];
  }
  async handleArtistLabel(value: string): Promise<void> {
    this.searchedValue = value;
    if (value.length > 2) {
      const artists = await MangaDot.api.getArtist(value);
      this.artistsFiltered = artists.suggestions;
    }
  }
}

export default MangaDotAdvancedSearchForm;
