const VOID_ELEMENTS = ["br"].join("|");

const VOID_ELEMENT_REGEX = new RegExp(`<(${VOID_ELEMENTS})((?:\\s+[^>]*?)?)\\s*/?>`, "gi");

export function fixVoidElements(html: string): string {
  return html.replace(VOID_ELEMENT_REGEX, (_match, tag: string, attributes: string) => {
    const attrs = attributes.trim();
    return attrs ? `<${tag.toLowerCase()} ${attrs} />` : `<${tag.toLowerCase()} />`;
  });
}
