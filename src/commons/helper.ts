export type Metadata = {
	page?: number
}
type QueryValue = string | number | boolean | undefined | null;
type QueryParam = QueryValue | QueryValue[] | Record<string, QueryValue>;
export class URLBuilder {

	parameters: Record<string, QueryParam> = {};
	pathComponents: string[] = [];
	baseUrl: string;
	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/(^\/)?(?=.*)(\/$)?/gim, "");
	}

	addPathComponent(component: string): URLBuilder {
		this.pathComponents.push(component.replace(/(^\/)?(?=.*)(\/$)?/gim, ""));
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
							.filter(v => v != null || includeUndefinedParameters)
							.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
					}

					if (typeof value === "object" && value !== null) {
						return Object.entries(value)
							.filter(([, v]) => v != null || includeUndefinedParameters)
							.map(
								([subKey, v]) =>
									`${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(String(v))}`,
							);
					}

					// Valore singolo (string, number, boolean)
					return [`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`];
				})
				.join("&");

			if (queryString) {
				finalUrl += "?" + queryString;
			}
		}

		return finalUrl;
	}

}
