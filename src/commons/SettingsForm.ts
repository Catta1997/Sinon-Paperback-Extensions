import {
    ContentRating,
    Form,
    NavigationRow,
    Section,
    SelectRow,
} from "@paperback/types";
import {
    getAdultFilter,
    getGenreFilter,
    getMangaTypeFilter,
    getMatureFilter,
    getOrderFilter,
} from "./helper";

export class SettingsForm extends Form {
    rating: undefined | ContentRating = undefined;
    constructor(contentRating: ContentRating) {
        super();
        this.rating = contentRating;
        console.log(this.rating);
    }

    override getSections(): Application.FormSectionElement[] {
        return [
            Section("playground", [
                NavigationRow("playground", {
                    title: "Contenuti",
                    subtitle: "Impostazioni Contenuti",
                    form: new FilterSettings(),
                }),
            ]),
            Section("content_rating", [
                NavigationRow("content_rating", {
                    title: "Rating",
                    subtitle: "Rating Contenuti",
                    isHidden: this.rating === ContentRating.ADULT,
                    form: new CustomContentRating(),
                }),
            ]),
        ];
    }
}

class State<T> {
    private _value: T;
    public get value(): T {
        return this._value;
    }

    public get selector(): SelectorID<(value: T) => Promise<void>> {
        return Application.Selector(this as State<T>, "updateValue");
    }

    constructor(
        private form: Form,
        value: T,
    ) {
        this._value = value;
    }

    public async updateValue(value: T): Promise<void> {
        this._value = value;
        this.form.reloadForm();
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

    defOrder = getOrderFilter().map(({ value, ...rest }) => ({
        title: value,
        ...rest,
    }));

    override getSections(): Application.FormSectionElement[] {
        return [
            Section(
                {
                    id: "update_settings",
                    footer:
                        "Questi cambiamenti potrebbero non avvenire in tutte le sezioni. " +
                        "Tieni presente che i generi nascosti restano nascosti anche se esplicitamente cercati nella ricerca",
                },
                [
                    SelectRow("hide_tags", {
                        title: "Nascondi Generi",
                        subtitle: "Nascondi alcuni Generi",
                        value: this.HideTagsStatusState.value,
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
                        value: this.HideTypeStatusState.value,
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
                    SelectRow("def_order", {
                        title: "Ordine Ricerca",
                        subtitle: "Ordinamento della Ricerca",
                        value: this.defOrderStatusState.value,
                        options: this.defOrder,
                        minItemCount: 0,
                        maxItemCount: 1,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleDefOrderStatusChange",
                        ),
                    }),
                    SelectRow("def_type", {
                        title: "Tipologia",
                        subtitle: "Tipologia di default",
                        value: this.defTypeStatusState.value,
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
        ];
    }

    /////// hide_tags
    getHideTagsStatus(): string[] {
        return (
            (Application.getState("hide_tags") as string[] | undefined) ?? []
        );
    }
    setHideTagsStatus(status: string[]): void {
        Application.setState(status, "hide_tags");
    }
    async handleHideTagsStatusChange(value: string[]): Promise<void> {
        console.log("handleHideTagsStatusChange " + value.join(", "));
        await this.HideTagsStatusState.updateValue(value);
        this.setHideTagsStatus(value);
        this.reloadForm();
    }
    private HideTagsStatusState = new State<string[]>(
        this,
        this.getHideTagsStatus(),
    );

    /////// hide_type
    getHideTypeStatus(): string[] {
        return (
            (Application.getState("hide_type") as string[] | undefined) ?? []
        );
    }
    setHideTypeStatus(status: string[]): void {
        Application.setState(status, "hide_type");
    }
    async handleHideTypeStatusChange(value: string[]): Promise<void> {
        console.log("handleHideTypeStatusChange " + value.join(", "));
        await this.HideTypeStatusState.updateValue(value);
        this.setHideTypeStatus(value);
        this.reloadForm();
    }
    private HideTypeStatusState = new State<string[]>(
        this,
        this.getHideTypeStatus(),
    );

    /////// def_order
    getDefOrderStatus(): string[] {
        return (
            (Application.getState("def_order") as string[] | undefined) ?? []
        );
    }
    setDefOrderStatus(status: string[]): void {
        Application.setState(status, "def_order");
    }
    async handleDefOrderStatusChange(value: string[]): Promise<void> {
        console.log("handleDefOrderStatusChange " + value.join(", "));
        await this.defOrderStatusState.updateValue(value);
        this.setDefOrderStatus(value);
        this.reloadForm();
        Application.invalidateSearchFilters();
    }
    private defOrderStatusState = new State<string[]>(
        this,
        this.getDefOrderStatus(),
    );

    /////// def_type
    getDefTypeStatus(): string[] {
        return (Application.getState("def_type") as string[] | undefined) ?? [];
    }
    setDefTypeStatus(status: string[]): void {
        Application.setState(status, "def_type");
    }
    async handleDefTypeStatusChange(value: string[]): Promise<void> {
        console.log("handleDefTypeStatusChange " + value.join(", "));
        await this.defTypeStatusState.updateValue(value);
        this.setDefTypeStatus(value);
        this.reloadForm();
        Application.invalidateSearchFilters();
    }
    private defTypeStatusState = new State<string[]>(
        this,
        this.getDefTypeStatus(),
    );
}

class CustomContentRating extends Form {
    genres = getGenreFilter().map(({ value, ...rest }) => ({
        title: value,
        ...rest,
    }));

    override getSections(): Application.FormSectionElement[] {
        return [
            Section(
                {
                    id: "content_settings",
                    footer:
                        "Modifica i generi ritenuti per adulti o maturi. " +
                        "Se uno stesso tag è in entrambi i gruppi, viene preso il livello più restrittivo" +
                        "Il genere 'per tutti' è per esclusione (il tag non è in nessuno dei due gruppi)",
                },
                [
                    SelectRow("adult_tags", {
                        title: "Generi Adulti",
                        subtitle: "Modifica i generi per Adulti",
                        value:
                            this.AdultTagsStatusState.value.length > 0
                                ? this.AdultTagsStatusState.value
                                : getAdultFilter().map(({ id }) => id),
                        options: this.genres,
                        minItemCount: 1,
                        maxItemCount: this.genres.length,
                        onValueChange: Application.Selector(
                            this as CustomContentRating,
                            "handleAdultTagsStatusChange",
                        ),
                    }),

                    SelectRow("mature_tags", {
                        title: "Generi Maturi",
                        subtitle: "Modifica i generi Maturi",
                        value:
                            this.MatureTagsStatusState.value.length > 0
                                ? this.MatureTagsStatusState.value
                                : getMatureFilter().map(({ id }) => id),
                        options: this.genres,
                        minItemCount: 1,
                        maxItemCount: this.genres.length,
                        onValueChange: Application.Selector(
                            this as CustomContentRating,
                            "handleMatureTagsStatusChange",
                        ),
                    }),
                ],
            ),
        ];
    }

    /////// adult_tags
    getAdultTagsStatus(): string[] {
        return (
            (Application.getState("adult_tags") as string[] | undefined) ?? []
        );
    }
    setAdultTagsStatus(status: string[]): void {
        Application.setState(status, "adult_tags");
    }
    async handleAdultTagsStatusChange(value: string[]): Promise<void> {
        console.log("handleAdultTagsStatusChange " + value.join(", "));
        await this.AdultTagsStatusState.updateValue(value);
        this.setAdultTagsStatus(value);
        this.reloadForm();
    }
    private AdultTagsStatusState = new State<string[]>(
        this,
        this.getAdultTagsStatus(),
    );

    /////// mature_tags
    getMatureTagsStatus(): string[] {
        return (
            (Application.getState("mature_tags") as string[] | undefined) ?? []
        );
    }
    setMatureTagsStatus(status: string[]): void {
        Application.setState(status, "mature_tags");
    }
    async handleMatureTagsStatusChange(value: string[]): Promise<void> {
        console.log("handleMatureTagsStatusChange " + value.join(", "));
        await this.MatureTagsStatusState.updateValue(value);
        this.setMatureTagsStatus(value);
        this.reloadForm();
    }
    private MatureTagsStatusState = new State<string[]>(
        this,
        this.getMatureTagsStatus(),
    );
}
