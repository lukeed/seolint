import type { Document, Element } from "@lukeed/html";

/** Directives that take a value after a colon, so their name is not a user agent. */
const VALUED = new Set([
	"unavailable_after",
	"max-snippet",
	"max-image-preview",
	"max-video-preview",
]);

/**
 * The robots meta tags that apply to Google: `robots` and `googlebot`.
 */
export function tags(document: Document): Element[] {
	return document.all("meta[name=robots i], meta[name=googlebot i]");
}

/**
 * The directives of a robots meta `content`, in lowercase.
 * @example
 * directives.meta("NoIndex, follow"); //=> ["noindex", "follow"]
 */
export function meta(content: string): string[] {
	return content
		.toLowerCase()
		.split(",")
		.map((x) => x.trim())
		.filter(Boolean);
}

/**
 * The directives of an `X-Robots-Tag` header that apply to Google, in
 * lowercase. A `name:` prefix scopes the directives after it to that user
 * agent; only unscoped and `googlebot:` directives apply.
 * @example
 * directives.header("googlebot: noindex, otherbot: nofollow"); //=> ["noindex"]
 */
export function header(value: string): string[] {
	let output: string[] = [];
	let agent: string | undefined;
	for (let raw of meta(value)) {
		let match = /^([\w-]+)\s*:\s*(.*)$/.exec(raw);
		let token = raw;
		if (match && !VALUED.has(match[1])) {
			agent = match[1];
			token = match[2];
		}
		if (token && (!agent || agent === "googlebot")) output.push(token);
	}
	return output;
}

/**
 * Whether directives ask search engines to leave the page out of results.
 * @example
 * directives.noindex(["none"]); //=> true
 */
export function noindex(tokens: string[]): boolean {
	return tokens.includes("noindex") || tokens.includes("none");
}
