import {
    Form,
    FormSectionElement,
    NavigationRow,
    Section,
    SelectRow,
} from "@paperback/types";
import { getGenreFilter, getMangaTypeFilter } from "./utils";

export class Forms extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("playground", [
                NavigationRow("playground", {
                    title: "Contenuti",
                    subtitle: "Impostazioni Contenuti",
                    form: new FilterSettings(),
                }),
            ]),
        ];
    }
}

class FilterSettings extends Form {
    genres = getGenreFilter().map(({ value, ...rest }) => ({
        title: value,
        ...rest,
    }));

    mangaTypes = getMangaTypeFilter().map(({ value, ...rest }) => ({
        title: value,
        ...rest,
    }));

    public async updateValue(value: string[], filter: string): Promise<void> {
        Application.setState(value, filter);
        console.log(`[SETTINGS] Updated: [${value.join(",")}] per ${filter}`);
        this.reloadForm();
        Application.invalidateSearchFilters();
    }
    override getSections(): FormSectionElement[] {
        return [
            Section(
                {
                    id: "update_settings",
                    footer:
                        "Potrebbero non venir nascosti in tutte le sezioni della home. " +
                        "Tieni presente che verranno rimossi anche dalla ricerca",
                },
                [
                    SelectRow("hide_tags", {
                        title: "Nascondi Generi",
                        subtitle: "Nascondi alcuni Generi",
                        value: this.getHideTagsStatus(),
                        options: this.genres,
                        minItemCount: 0,
                        maxItemCount: this.genres.length,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleHideTagsStatusChange",
                        ),
                    }),

                    SelectRow("hide_type", {
                        title: "Nascondi Tipologia",
                        subtitle: "Nascondi alcune Tipologie",
                        value: this.getHideTypeStatus(),
                        options: this.mangaTypes,
                        minItemCount: 0,
                        maxItemCount: this.mangaTypes.length,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleHideTypeStatusChange",
                        ),
                    }),
                ],
            ),
            Section(
                {
                    id: "default_settings",
                    footer: "Cambia i filtri di default della ricerca",
                },
                [
                    SelectRow("def_type", {
                        title: "Tipologia",
                        subtitle: "Tipologia di default",
                        value: this.getDefTypeStatus(),
                        options: this.mangaTypes,
                        minItemCount: 0,
                        maxItemCount: 1,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleDefTypeStatusChange",
                        ),
                    }),
                ],
            ),
            Section(
                {
                    id: "home_settings",
                    footer: "Aggiungi ricerche alla home",
                },
                [
                    SelectRow("fav_tags_new", {
                        title: "Generi Preferiti",
                        subtitle:
                            "Aggiungi alla home una sezione per le nuove aggiunte di questo genere",
                        value: this.getFavTagsNewStatus(),
                        options: this.genres,
                        minItemCount: 0,
                        maxItemCount: 3,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleFavTagsNewStatusChange",
                        ),
                    }),
                ],
            ),
        ];
    }

    // hide_tags
    getHideTagsStatus(): string[] {
        return (
            (Application.getState("hide_tags") as string[] | undefined) ?? []
        );
    }

    async handleHideTagsStatusChange(value: string[]): Promise<void> {
        await this.updateValue(value, "hide_tags");
    }

    // hide_type
    getHideTypeStatus(): string[] {
        return (
            (Application.getState("hide_type") as string[] | undefined) ?? []
        );
    }

    async handleHideTypeStatusChange(value: string[]): Promise<void> {
        await this.updateValue(value, "hide_type");
    }

    // def_type
    getDefTypeStatus(): string[] {
        return (Application.getState("def_type") as string[] | undefined) ?? [];
    }

    async handleDefTypeStatusChange(value: string[]): Promise<void> {
        await this.updateValue(value, "def_type");
    }

    // fav_tags_new
    getFavTagsNewStatus(): string[] {
        return (
            (Application.getState("fav_tags_new") as string[] | undefined) ?? []
        );
    }

    async handleFavTagsNewStatusChange(value: string[]): Promise<void> {
        await this.updateValue(value, "fav_tags_new");
    }
}
