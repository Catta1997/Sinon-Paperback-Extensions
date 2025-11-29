import {
    Form,
    Section,
    SelectRow,
    type FormSectionElement,
} from "@paperback/types";
import { typeFilter } from "./utils";

export class Forms extends Form {
    override getSections(): FormSectionElement[] {
        const types: { id: string; title: string }[] = typeFilter.map(
            (tag) => ({
                id: tag.id,
                title: tag.value,
            }),
        );
        return [
            Section(
                {
                    id: "update_settings",
                    footer: "Show only this type of content in everywhere. ",
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
                ],
            ),
        ];
    }
    public async updateValue(value: string[], filter: string): Promise<void> {
        Application.setState(value, filter);
        this.reloadForm();
        Application.invalidateSearchFilters();
    }

    getHideTypeStatus(): string[] {
        return (Application.getState("_type") as string[] | undefined) ?? [];
    }

    async handleHideTypeStatusChange(value: string[]): Promise<void> {
        await this.updateValue(value, "_type");
    }
}
