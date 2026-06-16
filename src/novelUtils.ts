const VOID_TAGS = "area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr";

export function fixVoidElements(html: string): string {
  return (
    html
      // EPUB
      .replaceAll(/\s+epub:[\w-]+=(["'])(.*?)\1/gi, "")
      // namespace XML
      .replaceAll(/\s+xmlns:[\w-]+=(["'])(.*?)\1/gi, "")
      // handler
      .replaceAll(/\s+on[\w-]+=(["'])(.*?)\1/gi, "")
      // <picture> ... <img ...> ... </picture> -> <img ... />
      .replaceAll(
        /<picture[^>]*>[\s\S]*?<img([^>]*)>[\s\S]*?<\/picture>/gi,
        `<img$1 style="display:block; margin:0 auto;"/>`,
      )
      .replaceAll(new RegExp(`<(${VOID_TAGS})(\\s[^>]*?)?>`, "gi"), (match, tag, attrs = "") => {
        if (match.endsWith("/>")) {
          return match;
        }
        return `<${tag}${attrs} />`;
      })
  );
}
