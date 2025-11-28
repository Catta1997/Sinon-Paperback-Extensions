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
        id: "32",
        value: "Western",
    },
    {
        id: "64",
        value: "Non-H",
    },
    {
        id: "128",
        value: "Image Set",
    },
    {
        id: "256",
        value: "Cosplay",
    },
    {
        id: "512",
        value: "Asian Porn",
    },
    {
        id: "1028",
        value: "Misc",
    },
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
