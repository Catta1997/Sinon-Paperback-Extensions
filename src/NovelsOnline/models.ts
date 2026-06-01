import type { JSONObject } from "@paperback/types";

export interface Metadata extends JSONObject {
  page: number;
}

export interface SearchMetadata extends JSONObject {
  keyword?: string;

  novel_type?: string[];

  language?: string[];

  genre?: string[];

  completed?: string;
}
