import { plugin } from "../plugin";
import * as about from "./meta";

/**
 * Normalize a URL for comparison: without a hash, and `null` when invalid.
 * @example
 * normalize("https://example.com/a/#top"); //=> "https://example.com/a/"
 */
function normalize(input: string): string | null {
	if (!URL.canParse(input)) return null;
	let url = new URL(input);
	url.hash = "";
	return url.href;
}

export const canonical = plugin({
	name: "canonical",
	rules: {
		"canonical.exists": true,
		"canonical.single": true,
		"canonical.href.exists": true,
		"canonical.href.absolute": true,
		"canonical.href.lowercase": true,
		"canonical.href.https": true,
		"canonical.href.match": { hostname: "" },
		"canonical.href.self": true,
		"canonical.head": true,
	},
	meta: about.meta({
		"canonical.exists": 'A page has a <link rel="canonical"> tag.',
		"canonical.single": "A page has only one canonical link.",
		"canonical.href.exists": "The canonical link has a non-empty href.",
		"canonical.href.absolute": "The canonical href is an absolute URL.",
		"canonical.href.lowercase": "The canonical href has no uppercase letters.",
		"canonical.href.https": "The canonical href uses https://.",
		"canonical.href.match": "The canonical href includes the site hostname.",
		"canonical.href.self": [
			"warn",
			"The canonical href points at the page itself.",
		],
		"canonical.head": "The canonical link is inside <head>.",
	}),
	run(context, document) {
		let [elem, ...rest] = document.all("link[rel=canonical]");

		context.assert(
			"canonical.exists",
			elem != null,
			"A canonical link must exist",
		);
		context.assert(
			"canonical.single",
			rest.length === 0,
			"Must have only one canonical link",
			rest[0],
		);
		if (!elem) return;

		context.assert(
			"canonical.head",
			elem.closest("head") != null,
			"Must be inside <head>",
			elem,
		);

		let target = elem.getAttr("href") || "";

		context.assert(
			"canonical.href.exists",
			target.length > 0,
			"Must not have empty `href` target",
		);

		context.assert(
			"canonical.href.absolute",
			/^https?:\/\//.test(target),
			"Must include a URL protocol in target",
			elem,
		);

		context.assert(
			"canonical.href.lowercase",
			!/[A-Z]/.test(target),
			"Must not include uppercase character(s)",
			elem,
		);

		context.assert(
			"canonical.href.https",
			/^https:\/\//.test(target),
			'Must point to an "https://" address',
			elem,
		);

		let { host } = context.options;

		context.assert(
			"canonical.href.match",
			(o) => target.includes(o.hostname || host || "\0"),
			"Must include the provided `hostname` value",
			elem,
		);

		if (context.url) {
			context.assert(
				"canonical.href.self",
				normalize(target) === normalize(context.url),
				`Must point to this page, ${context.url}`,
				elem,
			);
		}
	},
});
