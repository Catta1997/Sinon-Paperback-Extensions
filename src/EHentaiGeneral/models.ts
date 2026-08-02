import { type DiscoverSection, DiscoverSectionType } from "@paperback/types";

export function getSections(): Record<string, DiscoverSection> {
  return {
    Featured: {
      id: "Featured",
      title: "Featured",
      subtitle: "",
      type: DiscoverSectionType.featured,
    },
    Popular: {
      id: "Popular",
      title: "Popular",
      subtitle: "",
      type: DiscoverSectionType.featured,
    },
    Watched: {
      id: "Watched",
      title: "Watched",
      subtitle: "",
      type: DiscoverSectionType.featured,
    },
    Favorite: {
      id: "Favorite",
      title: "Favorite",
      subtitle: "",
      type: DiscoverSectionType.genres,
    },
  };
}
