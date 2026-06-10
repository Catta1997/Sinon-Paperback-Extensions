export const DOMAIN = "https://lnori.com";

export function toTitleCase(str: string): string {
  return str.replace(
    /\b[\p{L}\p{N}]+/gu,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}
