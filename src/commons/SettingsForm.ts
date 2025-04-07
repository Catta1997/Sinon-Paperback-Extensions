// TODO: Rework

import {
	Form,
	NavigationRow,
	Section,
	SelectRow,
} from "@paperback/types";

import {Functions} from "./Functions";
export class SettingsForm extends Form {
	override getSections(): Application.FormSectionElement[] {
		return [
			Section("playground", [
				NavigationRow("playground", {
					title: "Contenuti",
					subtitle: "Imposazioni tag Contenuti",
					form: new SourceUIPlaygroundForm(),
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

class SourceUIPlaygroundForm extends Form {
	inputValue = new State(this, "");
	rowsVisible = new State(this, false);
	items: string[] = [];
	function = new Functions("")
	genres = [
		{ title: "Adulti", id: "adulti" },
		{ title: "Arti Marziali", id: "arti-marziali" },
		{ title: "Avventura", id: "avventura" },
		{ title: "Azione", id: "azione" },
		{ title: "Commedia", id: "commedia" },
		{ title: "Doujinshi", id: "doujinshi" },
		{ title: "Drammatico", id: "drammatico" },
		{ title: "Ecchi", id: "ecchi" },
		{ title: "Fantasy", id: "fantasy" },
		{ title: "Gender Bender", id: "gender-bender" },
		{ title: "Harem", id: "harem" },
		{ title: "Hentai", id: "hentai" },
		{ title: "Horror", id: "horror" },
		{ title: "Josei", id: "josei" },
		{ title: "Lolicon", id: "lolicon" },
		{ title: "Maturo", id: "maturo" },
		{ title: "Mecha", id: "mecha" },
		{ title: "Mistero", id: "mistero" },
		{ title: "Psicologico", id: "psicologico" },
		{ title: "Romantico", id: "romantico" },
		{ title: "Sci-fi", id: "sci-fi" },
		{ title: "Scolastico", id: "scolastico" },
		{ title: "Seinen", id: "seinen" },
		{ title: "Shotacon", id: "shotacon" },
		{ title: "Shoujo", id: "shoujo" },
		{ title: "Shoujo Ai", id: "shoujo-ai" },
		{ title: "Shounen", id: "shounen" },
		{ title: "Shounen Ai", id: "shounen-ai" },
		{ title: "Slice of Life", id: "slice-of-life" },
		{ title: "Smut", id: "smut" },
		{ title: "Soprannaturale", id: "soprannaturale" },
		{ title: "Sport", id: "sport" },
		{ title: "Storico", id: "storico" },
		{ title: "Tragico", id: "tragico" },
		{ title: "Yaoi", id: "yaoi" },
		{ title: "Yuri", id: "yuri" }
	]

	MangaTypes =  [
		{ title: "Manga", id: "manga" },
		{ title: "Manhua", id: "manhua" },
		{ title: "Manhwa", id: "manhwa" },
		{ title: "Oneshot", id: "oneshot" },
		{ title: "Thai", id: "thai" },
		{ title: "Vietnamita", id: "vietnamese" }
	]
	override getSections(): Application.FormSectionElement[] {
		return [
			Section(
				{
					id: "update_settings",
					footer: "Note: These settings do not enable automatic updates. Automatic updates are handled by Paperback itself (if implemented). These settings just affect how updates are managed when they occur.",
				},
				[
					SelectRow("hide_tags", {
						title: "Nascondi tags",
						subtitle: "Nascondi alcuni tag dalla ricerca e da alcune altri",
						value: this.HideTagsStatusState.value,
						options: this.genres,
						minItemCount: 0,
						maxItemCount: this.genres.length,
						onValueChange: Application.Selector(
							this as SourceUIPlaygroundForm,
							"handleHideTagsStatusChange",
						),
					}),
					SelectRow("hide_type", {
						title: "Nascondi Generi",
						subtitle: "Nascondi alcuni generi dalla ricerca e da alcune altri",
						value: this.HideTypeStatusState.value,
						options: this.MangaTypes,
						minItemCount: 0,
						maxItemCount: this.MangaTypes.length,
						onValueChange: Application.Selector(
							this as SourceUIPlaygroundForm,
							"handleHideTagsStatusChange",
						),
					}),
				],
			),
		];
	}

	getHideTagsStatus(): string[] {
		return (
			(Application.getState("hide_tags") as
				| string[]
				| undefined) ?? []
		);
	}

	setHideTagsStatus(status: string[]): void {
		Application.setState(status, "hide_tags");
	}

	async handleHideTagsStatusChange(value: string[]): Promise<void> {
		await this.HideTagsStatusState.updateValue(value);
		this.setHideTagsStatus(value);
		this.reloadForm();
	}
	private HideTagsStatusState = new State<string[]>(
		this,
		this.getHideTagsStatus(),
	);


	getHideTypeStatus(): string[] {
		return (
			(Application.getState("hide_type") as
				| string[]
				| undefined) ?? []
		);
	}

	setHideTypeStatus(status: string[]): void {
		Application.setState(status, "hide_type");
	}

	async handleHideTypeStatusChange(value: string[]): Promise<void> {
		await this.HideTypeStatusState.updateValue(value);
		this.setHideTypeStatus(value);
		this.reloadForm();
	}
	private HideTypeStatusState = new State<string[]>(
		this,
		this.getHideTypeStatus(),
	);
}
