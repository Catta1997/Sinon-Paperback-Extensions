
export function normalizeId(id:string): string{
	return id.replaceAll("-", "@").replaceAll("'", "&").replaceAll(" ", "#")
}

export function deNormalizeId(id:string): string{
	return id.replaceAll("@", "-").replaceAll("&", "'").replaceAll("#", " ")
}