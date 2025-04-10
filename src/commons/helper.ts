export type Metadata = {
    page?: number;
};
type QueryValue = string | number | boolean | undefined | null;
type QueryParam = QueryValue | QueryValue[] | Record<string, QueryValue>;

export function getMangaTypeFilter() {
    return [
        { value: "Manga", id: "manga" },
        { value: "Manhua", id: "manhua" },
        { value: "Manhwa", id: "manhwa" },
        { value: "Oneshot", id: "oneshot" },
        { value: "Thai", id: "thai" },
        { value: "Vietnamita", id: "vietnamese" },
    ];
}

export function getOrderFilter() {
    return [
        { value: "Più Letto", id: "most_read" },
        { value: "Meno Letto", id: "less_read" },
        { value: "Alfabetico A-Z", id: "a-z" },
        { value: "Alfabetico Z-A", id: "z-a" },
        { value: "Più recente", id: "newest" },
        { value: "Meno recente", id: "oldest" },
    ];
}

export function getGenreFilter() {
    return [
        { value: "Adulti", id: "adulti" },
        { value: "Arti Marziali", id: "arti-marziali" },
        { value: "Avventura", id: "avventura" },
        { value: "Azione", id: "azione" },
        { value: "Commedia", id: "commedia" },
        { value: "Doujinshi", id: "doujinshi" },
        { value: "Drammatico", id: "drammatico" },
        { value: "Ecchi", id: "ecchi" },
        { value: "Fantasy", id: "fantasy" },
        { value: "Gender Bender", id: "gender-bender" },
        { value: "Harem", id: "harem" },
        { value: "Hentai", id: "hentai" },
        { value: "Horror", id: "horror" },
        { value: "Josei", id: "josei" },
        { value: "Lolicon", id: "lolicon" },
        { value: "Maturo", id: "maturo" },
        { value: "Mecha", id: "mecha" },
        { value: "Mistero", id: "mistero" },
        { value: "Psicologico", id: "psicologico" },
        { value: "Romantico", id: "romantico" },
        { value: "Sci-fi", id: "sci-fi" },
        { value: "Scolastico", id: "scolastico" },
        { value: "Seinen", id: "seinen" },
        { value: "Shotacon", id: "shotacon" },
        { value: "Shoujo", id: "shoujo" },
        { value: "Shoujo Ai", id: "shoujo-ai" },
        { value: "Shounen", id: "shounen" },
        { value: "Shounen Ai", id: "shounen-ai" },
        { value: "Slice of Life", id: "slice-of-life" },
        { value: "Smut", id: "smut" },
        { value: "Soprannaturale", id: "soprannaturale" },
        { value: "Sport", id: "sport" },
        { value: "Storico", id: "storico" },
        { value: "Tragico", id: "tragico" },
        { value: "Yaoi", id: "yaoi" },
        { value: "Yuri", id: "yuri" },
    ];
}

export class URLBuilder {
    parameters: Record<string, QueryParam> = {};
    pathComponents: string[] = [];
    baseUrl: string;
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/(^\/)?(?=.*)(\/$)?/gim, "");
    }

    addPathComponent(component: string): URLBuilder {
        this.pathComponents.push(
            component.replace(/(^\/)?(?=.*)(\/$)?/gim, ""),
        );
        return this;
    }

    addQueryParameter(key: string, value: QueryParam): URLBuilder {
        this.parameters[key] = value;
        return this;
    }

    buildUrl(
        { addTrailingSlash, includeUndefinedParameters } = {
            addTrailingSlash: false,
            includeUndefinedParameters: false,
        },
    ): string {
        let finalUrl = this.baseUrl + "/";

        // Join dei path component
        finalUrl += this.pathComponents.join("/");
        if (addTrailingSlash) finalUrl += "/";

        const entries = Object.entries(this.parameters);

        if (entries.length > 0) {
            const queryString = entries
                .flatMap(([key, value]) => {
                    if (value == null && !includeUndefinedParameters) return [];

                    if (Array.isArray(value)) {
                        return value
                            .filter(
                                (v) => v != null || includeUndefinedParameters,
                            )
                            .map(
                                (v) =>
                                    `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`,
                            );
                    }

                    if (typeof value === "object" && value !== null) {
                        return Object.entries(value)
                            .filter(
                                ([, v]) =>
                                    v != null || includeUndefinedParameters,
                            )
                            .map(
                                ([subKey, v]) =>
                                    `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(String(v))}`,
                            );
                    }

                    // Valore singolo (string, number, boolean)
                    return [
                        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
                    ];
                })
                .join("&");

            if (queryString) {
                finalUrl += "?" + queryString;
            }
        }

        return finalUrl;
    }
}
