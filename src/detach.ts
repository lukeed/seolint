/**
 * A copy of `text` that does not keep its source alive. Engines build a
 * substring as a view of its parent string, so a short title that is kept
 * would also keep the whole page's HTML in memory. Concatenation is not
 * enough, because JavaScriptCore slices a rope from its parts.
 * @example
 * let title = detach(document.find("title").text);
 */
export function detach(text: string): string {
	return JSON.parse(JSON.stringify(text));
}
