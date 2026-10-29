/**
 * A page URL in the form that compares equal for every URL of the page:
 * without its hash, `index.html`, or `.html` extension, since hosts serve
 * `about.html` at `/about` too. `undefined` when the URL is invalid.
 * @example
 * address.normalize("https://example.com/about.html#team"); //=> "https://example.com/about"
 * address.normalize("https://example.com/blog/index.html"); //=> "https://example.com/blog/"
 */
export function normalize(input: string): string | undefined {
	let url = URL.parse(input);
	if (!url) return;
	url.hash = "";
	url.pathname = url.pathname
		.replace(/(^|\/)index\.html?$/, "$1")
		.replace(/\.html?$/, "");
	return url.href;
}
