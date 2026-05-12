export class MangaDotFilters {
  genres: string[] = [];
  status: { id: string; title: string }[] = [
    {
      id: "",
      title: "Any",
    },
    {
      id: "Ongoing",
      title: "Ongoing",
    },
    {
      id: "Completed",
      title: "Completed",
    },
    {
      id: "Hiatus",
      title: "Hiatus",
    },
  ];
  origin: { id: string; title: string }[] = [
    {
      id: "JP",
      title: "Manga",
    },
    {
      id: "KR",
      title: "Manhwa",
    },
    {
      id: "CN",
      title: "Manhua",
    },
  ];
  setGenre(genres: string[]) {
    this.genres = genres;
  }
}
