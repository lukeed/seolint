/**
 * A copy of `text` that does not keep its source alive. Engines build a
 * substring as a view of its parent string, so a short title that is kept
 * would also keep the whole page's HTML in memory.
 * @example
 * let title = detach(document.find("title").text);
 */
export function detach(text: string): string {
	return (" " + text).slice(1);
}
