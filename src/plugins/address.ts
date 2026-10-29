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
	url.pathname = path(url.pathname);
	return url.href;
}

/**
 * A URL path in the form that compares equal for every URL of the page, as
 * {@link normalize} does for a whole URL.
 * @example
 * address.path("/blog/index.html"); //=> "/blog/"
 */
export function path(pathname: string): string {
	return pathname.replace(/(^|\/)index\.html?$/, "$1").replace(/\.html?$/, "");
}
