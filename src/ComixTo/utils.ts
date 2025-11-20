export class globalFilters {
    genres = [
        { id: "6", value: "Action" },
        { id: "31", value: "Aliens" },
        { id: "32", value: "Animals" },
        { id: "7", value: "Adventure" },
        { id: "87264", value: "Adult" },
        { id: "8", value: "Boys Love" },
        { id: "9", value: "Comedy" },
        { id: "33", value: "Cooking" },
        { id: "34", value: "Crossdressing" },
        { id: "10", value: "Crime" },
        { id: "35", value: "Delinquents" },
        { id: "36", value: "Demons" },
        { id: "11", value: "Drama" },
        { id: "87265", value: "Ecchi" },
        { id: "12", value: "Fantasy" },
        { id: "13", value: "Girls Love" },
        { id: "37", value: "Genderswap" },
        { id: "38", value: "Ghosts" },
        { id: "39", value: "Gyaru" },
        { id: "40", value: "Harem" },
        { id: "87266", value: "Hentai" },
        { id: "14", value: "Historical" },
        { id: "15", value: "Horror" },
        { id: "16", value: "Isekai" },
        { id: "41", value: "Incest" },
        { id: "3", value: "Josei" },
        { id: "42", value: "Loli" },
        { id: "17", value: "Magical Girls" },
        { id: "44", value: "Magic" },
        { id: "43", value: "Mafia" },
        { id: "45", value: "Martial Arts" },
        { id: "87267", value: "Mature" },
        { id: "18", value: "Mecha" },
        { id: "19", value: "Medical" },
        { id: "46", value: "Military" },
        { id: "47", value: "Monster Girls" },
        { id: "48", value: "Monsters" },
        { id: "49", value: "Music" },
        { id: "20", value: "Mystery" },
        { id: "50", value: "Ninja" },
        { id: "51", value: "Office Workers" },
        { id: "21", value: "Philosophical" },
        { id: "52", value: "Police" },
        { id: "53", value: "Post-Apocalyptic" },
        { id: "22", value: "Psychological" },
        { id: "54", value: "Reincarnation" },
        { id: "55", value: "Reverse Harem" },
        { id: "23", value: "Romance" },
        { id: "56", value: "Samurai" },
        { id: "57", value: "School Life" },
        { id: "24", value: "Sci-Fi" },
        { id: "58", value: "Shota" },
        { id: "1", value: "Shoujo" },
        { id: "2", value: "Shounen" },
        { id: "25", value: "Slice of Life" },
        { id: "87268", value: "Smut" },
        { id: "26", value: "Sports" },
        { id: "27", value: "Superhero" },
        { id: "59", value: "Supernatural" },
        { id: "60", value: "Survival" },
        { id: "61", value: "Time Travel" },
        { id: "28", value: "Thriller" },
        { id: "62", value: "Traditional Games" },
        { id: "29", value: "Tragedy" },
        { id: "63", value: "Vampires" },
        { id: "64", value: "Video Games" },
        { id: "65", value: "Villainess" },
        { id: "66", value: "Virtual Reality" },
        { id: "30", value: "Wuxia" },
        { id: "67", value: "Zombies" },
    ];

    contentType = [
        { id: "manga", value: "Manga" },
        { id: "manhwa", value: "Manhwa" },
        { id: "manhua", value: "Manhua" },
        { id: "other", value: "Other" },
    ];

    order = [
        { id: "relevance$desc", label: "Relevance" },
        { id: "views_30d$desc", label: "Normal" },
        { id: "title$asc", label: "Title" },
        { id: "chapter_updated_at$desc", label: "Update" },
        { id: "total_views$desc", label: "Total Views" },
        { id: "followed_count$desc", label: "Followed Count" },
        { id: "year$desc", label: "Year" },
        { id: "created_at$desc", label: "Created" },
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

    sectionLimit = [
        { id: "7", value: "Week" },
        { id: "30", value: "1 Month" },
        { id: "90", value: "3 Month" },
        { id: "180", value: "6 Month" },
        { id: "365", value: "1 Year" },
    ];

    getHiddenGenresSettings() {
        return (
            (Application.getState("hide_tags") as string[] | undefined) ?? []
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
