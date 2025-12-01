import {
    Form,
    Section,
    SelectRow,
    type FormSectionElement,
} from "@paperback/types";
import { languageFilter, typeFilter } from "./utils";

export class Forms extends Form {
    override getSections(): FormSectionElement[] {
        const types: { id: string; title: string }[] = typeFilter.map(
            (tag) => ({
                id: tag.id,
                title: tag.value,
            }),
        );
        const languages: { id: string; title: string }[] = languageFilter.map(
            (tag) => ({
                id: tag.id,
                title: tag.value,
            }),
        );

        return [
            Section(
                {
                    id: "update_settings",
                    footer: "Filter Settings",
                },
                [
                    SelectRow("hide_type", {
                        title: "Show Only",
                        subtitle: "Show only this contents",
                        value: this.getHideTypeStatus(),
                        options: types,
                        minItemCount: 0,
                        maxItemCount: types.length,
                        onValueChange: Application.Selector(
                            this as Forms,
                            "handleHideTypeStatusChange",
                        ),
                    }),
                    SelectRow("language_filter", {
                        title: "Show This Languages Only",
                        subtitle:
                            "Show only this languages in the search filter",
                        value: this.getFilterStatus(),
                        options: languages,
                        minItemCount: 0,
                        maxItemCount: languages.length,
                        onValueChange: Application.Selector(
                            this as Forms,
                            "handleFilterStatusChange",
                        ),
                    }),
                ],
            ),
        ];
    }
    public async updateValue(value: string[], filter: string): Promise<void> {
        Application.setState(value, filter);
        Application.invalidateSearchFilters();
        this.reloadForm();
    }

    getHideTypeStatus(): string[] {
        return (Application.getState("_type") as string[] | undefined) ?? [];
    }

    async handleHideTypeStatusChange(value: string[]): Promise<void> {
        await this.updateValue(value, "_type");
    }

    getFilterStatus(): string[] {
        return (
            (Application.getState("_languageFilter") as string[] | undefined) ??
            languageFilter.map((language) => language.id)
        );
    }

    async handleFilterStatusChange(value: string[]): Promise<void> {
        await this.updateValue(value, "_languageFilter");
    }
}
