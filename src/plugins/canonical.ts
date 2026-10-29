import { plugin } from "../plugin";
import * as address from "./address";
import * as about from "./meta";

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
		"canonical.href.match": "The canonical href uses the site hostname.",
		"canonical.href.self": [
			"warn",
			"The canonical href points at the page itself.",
		],
		"canonical.head": "The canonical link is inside <head>.",
	}),
	run(context, document) {
		let [elem, ...rest] = document.all("link[rel~=canonical i]");

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

		let match = context.load("canonical.href.match");
		let { host } = context.options;
		let hostname = (
			(match && match.hostname) ||
			(host && URL.parse(host)?.hostname) ||
			""
		).toLowerCase();

		if (hostname) {
			context.assert(
				"canonical.href.match",
				URL.parse(target)?.hostname === hostname,
				`Must point to the site hostname, ${hostname}`,
				elem,
			);
		}

		if (context.url) {
			context.assert(
				"canonical.href.self",
				address.normalize(target) === address.normalize(context.url),
				`Must point to this page, ${context.url}`,
				elem,
			);
		}
	},
});
