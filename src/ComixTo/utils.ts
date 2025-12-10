import type { SearchFilter } from "@paperback/types";

export class globalFilters {
    genres = [
        { id: "6", value: "Action" },
        { id: "87264", value: "Adult" },
        { id: "7", value: "Adventure" },
        { id: "8", value: "Boys Love" },
        { id: "9", value: "Comedy" },
        { id: "10", value: "Crime" },
        { id: "11", value: "Drama" },
        { id: "87265", value: "Ecchi" },
        { id: "12", value: "Fantasy" },
        { id: "13", value: "Girls Love" },
        { id: "87266", value: "Hentai" },
        { id: "14", value: "Historical" },
        { id: "15", value: "Horror" },
        { id: "16", value: "Isekai" },
        { id: "17", value: "Magical Girls" },
        { id: "87267", value: "Mature" },
        { id: "18", value: "Mecha" },
        { id: "19", value: "Medical" },
        { id: "20", value: "Mystery" },
        { id: "21", value: "Philosophical" },
        { id: "22", value: "Psychological" },
        { id: "23", value: "Romance" },
        { id: "24", value: "Sci-Fi" },
        { id: "25", value: "Slice of Life" },
        { id: "87268", value: "Smut" },
        { id: "26", value: "Sports" },
        { id: "27", value: "Superhero" },
        { id: "28", value: "Thriller" },
        { id: "29", value: "Tragedy" },
        { id: "30", value: "Wuxia" },
        { id: "1", value: "Shoujo" },
        { id: "2", value: "Shounen" },
        { id: "3", value: "Josei" },
    ];

    themes = [
        { id: "31", value: "Aliens" },
        { id: "32", value: "Animals" },
        { id: "33", value: "Cooking" },
        { id: "34", value: "Crossdressing" },
        { id: "35", value: "Delinquents" },
        { id: "36", value: "Demons" },
        { id: "37", value: "Genderswap" },
        { id: "38", value: "Ghosts" },
        { id: "39", value: "Gyaru" },
        { id: "40", value: "Harem" },
        { id: "41", value: "Incest" },
        { id: "42", value: "Loli" },
        { id: "43", value: "Mafia" },
        { id: "44", value: "Magic" },
        { id: "45", value: "Martial Arts" },
        { id: "46", value: "Military" },
        { id: "47", value: "Monster Girls" },
        { id: "48", value: "Monsters" },
        { id: "49", value: "Music" },
        { id: "50", value: "Ninja" },
        { id: "51", value: "Office Workers" },
        { id: "52", value: "Police" },
        { id: "53", value: "Post-Apocalyptic" },
        { id: "54", value: "Reincarnation" },
        { id: "55", value: "Reverse Harem" },
        { id: "56", value: "Samurai" },
        { id: "57", value: "School Life" },
        { id: "58", value: "Shota" },
        { id: "59", value: "Supernatural" },
        { id: "60", value: "Survival" },
        { id: "61", value: "Time Travel" },
        { id: "62", value: "Traditional Games" },
        { id: "63", value: "Vampires" },
        { id: "64", value: "Video Games" },
        { id: "65", value: "Villainess" },
        { id: "66", value: "Virtual Reality" },
        { id: "67", value: "Zombies" },
    ];

    contentType = [
        { id: "manga", value: "Manga" },
        { id: "manhwa", value: "Manhwa" },
        { id: "manhua", value: "Manhua" },
        { id: "other", value: "Other" },
    ];

    order = [
        { id: "relevance$desc", label: "Best Match" },
        { id: "chapter_updated_at$desc", label: "Update Date" },
        { id: "created_at$desc", label: "Created Date" },
        { id: "title$asc", label: "Title Ascending" },
        { id: "year$desc", label: "Year Descending" },
        { id: "score$desc", label: "Average Score" },
        { id: "views_7d$desc", label: "Most Views 7 Days" },
        { id: "views_30d$desc", label: "Most Views 1 Month" },
        { id: "views_90d$desc", label: "Most Views 3 Month" },
        { id: "total_views$desc", label: "Total Views" },
        { id: "followed_count$desc", label: "Most Follows" },
    ];

    publication_status = [
        { id: "finished", value: "Finished" },
        { id: "releasing", value: "Releasing" },
        { id: "on_hiatus", value: "On Hiatus" },
        { id: "discontinued", value: "Discontinued" },
        { id: "not_yet_released", value: "Not Yet Released" },
    ];
    demographic = [
        { id: "1", value: "Shoujo" },
        { id: "2", value: "Shounen" },
        { id: "3", value: "Josei" },
        { id: "4", value: "Seinen" },
    ];
    formats = [
        { id: "93164", value: "4-Koma" },
        { id: "93167", value: "Adaptation" },
        { id: "93165", value: "Anthology" },
        { id: "93166", value: "Award Winning" },
        { id: "93168", value: "Doujinshi" },
        { id: "93172", value: "Full Color" },
        { id: "93170", value: "Long Strip" },
        { id: "93169", value: "Oneshot" },
        { id: "93171", value: "Options" },
    ];

    sectionLimit = [
        { id: "7", value: "Week" },
        { id: "30", value: "1 Month" },
        { id: "90", value: "3 Month" },
        { id: "180", value: "6 Month" },
        { id: "365", value: "1 Year" },
    ];

    getFilters() {
        const filters: SearchFilter[] = [];
        const genresHidden = this.getHiddenGenresSettings();
        const getExcludedGenreObject = Object.fromEntries(
            this.genres
                .filter((option) => genresHidden.includes(option.id))
                .map((item) => [item.id, "excluded" as const]),
        ) as Record<string, "included" | "excluded">;
        const themesHidden = this.getHiddenThemesSettings();
        const getExcludedThemesObject = Object.fromEntries(
            this.genres
                .filter((option) => themesHidden.includes(option.id))
                .map((item) => [item.id, "excluded" as const]),
        ) as Record<string, "included" | "excluded">;
        const showOnly = this.getShowOnlySettings();
        const getShowOnlyObject = Object.fromEntries(
            this.contentType
                .filter((option) => showOnly.includes(option.id))
                .map((item) => [item.id, "included" as const]),
        ) as Record<string, "included" | "excluded">;

        filters.push({
            type: "multiselect",
            id: "genres",
            title: "Genres",
            options: this.genres,
            value: getExcludedGenreObject,
            allowExclusion: true,
            allowEmptySelection: true,
            maximum: this.genres.length,
        });
        filters.push({
            type: "multiselect",
            id: "themes",
            title: "Themes",
            options: this.themes,
            value: getExcludedThemesObject,
            allowExclusion: true,
            allowEmptySelection: true,
            maximum: this.themes.length,
        });
        filters.push({
            type: "multiselect",
            id: "formats",
            title: "Formats",
            options: this.formats,
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: this.formats.length,
        });
        filters.push({
            type: "dropdown",
            id: "filter_mode",
            title: "Filter Mode",
            value: "and",
            options: [
                { id: "and", value: "AND" },
                { id: "or", value: "OR" },
            ],
        });
        filters.push({
            type: "multiselect",
            id: "types",
            title: "Types",
            options: this.contentType,
            value: getShowOnlyObject,
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: this.contentType.length,
        });
        filters.push({
            type: "multiselect",
            id: "demographic",
            title: "Demographic",
            options: this.demographic,
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: this.demographic.length,
        });
        filters.push({
            type: "multiselect",
            id: "status",
            title: "Status",
            options: this.publication_status,
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: this.publication_status.length,
        });
        return filters;
    }

    getHiddenGenresSettings() {
        return (
            (Application.getState("hide_genres") as string[] | undefined) ?? []
        );
    }

    getHiddenThemesSettings() {
        return (
            (Application.getState("hide_themes") as string[] | undefined) ?? []
        );
    }

    getShowOnlySettings() {
        return (
            (Application.getState("show_only") as string[] | undefined) ?? []
        );
    }

    getLimitSettings() {
        return (Application.getState("limit") as string[] | undefined) ?? ["7"];
    }
}
