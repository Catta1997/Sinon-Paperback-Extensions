//f_cats
export type Metadata = { page: string };

export const typeFilter: {
    id: string;
    value: string;
}[] = [
    {
        id: "2",
        value: "Doujinshi",
    },
    {
        id: "4",
        value: "Manga",
    },
    {
        id: "8",
        value: "Artist CG",
    },
    {
        id: "16",
        value: "Game CG",
    },
    {
        id: "512",
        value: "Western",
    },
    {
        id: "256",
        value: "Non-H",
    },
    {
        id: "32",
        value: "Image Set",
    },
    {
        id: "64",
        value: "Cosplay",
    },
    {
        id: "128",
        value: "Asian Porn",
    },
    {
        id: "1",
        value: "Misc",
    },
];

function getLangFilter() {
    return (
        (Application.getState("_languageFilter") as string[] | undefined) ?? []
    );
}

export function getLangFlag(lang: string) {
    const langFlag = languageFilter.find((language) => language.id === lang);
    return langFlag?.flag ?? lang;
}

export function getLanguageFilter() {
    return languageFilter.filter((lang) => getLangFilter().includes(lang.id));
}

export const languageFilter: {
    id: string;
    value: string;
    flag: string;
}[] = [
    { id: "afrikaans", value: "Afrikaans", flag: "🇿🇦" },
    { id: "albanian", value: "Albanian", flag: "🇦🇱" },
    { id: "arabic", value: "Arabic", flag: "🇸🇦" },
    { id: "aramaic", value: "Aramaic", flag: "Aramaic" },
    { id: "armenian", value: "Armenian", flag: "🇦🇲" },
    { id: "bengali", value: "Bengali", flag: "🇧🇩" },
    { id: "bosnian", value: "Bosnian", flag: "🇧🇦" },
    { id: "bulgarian", value: "Bulgarian", flag: "🇧🇬" },
    { id: "burmese", value: "Burmese", flag: "🇲🇲" },
    { id: "catalan", value: "Catalan", flag: "🇪🇸" },
    { id: "cebuano", value: "Cebuano", flag: "Cebuano" },
    { id: "chinese", value: "Chinese", flag: "🇨🇳" },
    { id: "cree", value: "Cree", flag: "Cree" },
    { id: "creole", value: "Creole", flag: "Creole" },
    { id: "croatian", value: "Croatian", flag: "🇭🇷" },
    { id: "czech", value: "Czech", flag: "🇨🇿" },
    { id: "danish", value: "Danish", flag: "🇩🇰" },
    { id: "dutch", value: "Dutch", flag: "🇳🇱" },
    { id: "english", value: "English", flag: "🇬🇧" },
    { id: "esperanto", value: "Esperanto", flag: "Esperanto" },
    { id: "estonian", value: "Estonian", flag: "🇪🇪" },
    { id: "finnish", value: "Finnish", flag: "🇫🇮" },
    { id: "french", value: "French", flag: "🇫🇷" },
    { id: "georgian", value: "Georgian", flag: "🇬🇪" },
    { id: "german", value: "German", flag: "🇩🇪" },
    { id: "greek", value: "Greek", flag: "🇬🇷" },
    { id: "gujarati", value: "Gujarati", flag: "Gujarati" },
    { id: "hebrew", value: "Hebrew", flag: "🇮🇱" },
    { id: "hindi", value: "Hindi", flag: "🇮🇳" },
    { id: "hmong", value: "Hmong", flag: "Hmong" },
    { id: "hungarian", value: "Hungarian", flag: "🇭🇺" },
    { id: "icelandic", value: "Icelandic", flag: "🇮🇸" },
    { id: "indonesian", value: "Indonesian", flag: "🇮🇩" },
    { id: "irish", value: "Irish", flag: "🇮🇪" },
    { id: "italian", value: "Italian", flag: "🇮🇹" },
    { id: "japanese", value: "Japanese", flag: "🇯🇵" },
    { id: "javanese", value: "Javanese", flag: "Javanese" },
    { id: "kannada", value: "Kannada", flag: "Kannada" },
    { id: "kazakh", value: "Kazakh", flag: "🇰🇿" },
    { id: "khmer", value: "Khmer", flag: "🇰🇭" },
    { id: "korean", value: "Korean", flag: "🇰🇷" },
    { id: "kurdish", value: "Kurdish", flag: "Kurdish" },
    { id: "ladino", value: "Ladino", flag: "Ladino" },
    { id: "lao", value: "Lao", flag: "🇱🇦" },
    { id: "latin", value: "Latin", flag: "Latin" },
    { id: "latvian", value: "Latvian", flag: "🇱🇻" },
    { id: "marathi", value: "Marathi", flag: "🇮🇳" },
    { id: "mongolian", value: "Mongolian", flag: "🇲🇳" },
    { id: "ndebele", value: "Ndebele", flag: "🇿🇼" },
    { id: "nepali", value: "Nepali", flag: "🇳🇵" },
    { id: "norwegian", value: "Norwegian", flag: "🇳🇴" },
    { id: "oromo", value: "Oromo", flag: "Oromo" },
    { id: "papiamento", value: "Papiamento", flag: "Papiamento" },
    { id: "pashto", value: "Pashto", flag: "🇦🇫" },
    { id: "persian", value: "Persian", flag: "🇮🇷" },
    { id: "polish", value: "Polish", flag: "🇵🇱" },
    { id: "portuguese", value: "Portuguese", flag: "🇵🇹" },
    { id: "punjabi", value: "Punjabi", flag: "🇮🇳" },
    { id: "romanian", value: "Romanian", flag: "🇷🇴" },
    { id: "russian", value: "Russian", flag: "🇷🇺" },
    { id: "sango", value: "Sango", flag: "Sango" },
    { id: "sanskrit", value: "Sanskrit", flag: "Sanskrit" },
    { id: "serbian", value: "Serbian", flag: "🇷🇸" },
    { id: "shona", value: "Shona", flag: "Shona" },
    { id: "slovak", value: "Slovak", flag: "🇸🇰" },
    { id: "slovenian", value: "Slovenian", flag: "🇸🇮" },
    { id: "somali", value: "Somali", flag: "🇸🇴" },
    { id: "spanish", value: "Spanish", flag: "🇪🇸" },
    { id: "swahili", value: "Swahili", flag: "🇰🇪" },
    { id: "swedish", value: "Swedish", flag: "🇸🇪" },
    { id: "tagalog", value: "Tagalog", flag: "🇵🇭" },
    { id: "tamil", value: "Tamil", flag: "🇮🇳" },
    { id: "telugu", value: "Telugu", flag: "🇮🇳" },
    { id: "thai", value: "Thai", flag: "🇹🇭" },
    { id: "tibetan", value: "Tibetan", flag: "Tibetan" },
    { id: "tigrinya", value: "Tigrinya", flag: "Tigrinya" },
    { id: "turkish", value: "Turkish", flag: "🇹🇷" },
    { id: "ukrainian", value: "Ukrainian", flag: "🇺🇦" },
    { id: "urdu", value: "Urdu", flag: "🇵🇰" },
    { id: "vietnamese", value: "Vietnamese", flag: "🇻🇳" },
    { id: "welsh", value: "Welsh", flag: "🇬🇧" },
    { id: "yiddish", value: "Yiddish", flag: "Yiddish" },
    { id: "zulu", value: "Zulu", flag: "🇿🇦" },
];

//f_srdd
export const ratingFilter: {
    id: string;
    value: string;
}[] = [
    {
        id: "",
        value: "Any Rating",
    },
    {
        id: "2",
        value: "2 Stars",
    },
    {
        id: "3",
        value: "3 Stars",
    },
    {
        id: "4",
        value: "4 Stars",
    },
    {
        id: "5",
        value: "5 Stars",
    },
];

export interface GalleryInfo {
    category: string;
    uploader: {
        name: string;
    };
    posted: string;
    language: {
        text: string;
    };
    length: {
        pages: number;
    };
    rating: {
        average: number;
    };
}
