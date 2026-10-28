import { plugin } from "../plugin";
import * as about from "./meta";

/**
 * Whether a link path ends with a slash, or points to a file, such as `/menu.pdf`.
 * @example
 * trailing("/about/"); //=> true
 * trailing("/about"); //=> false
 */
function trailing(path: string): boolean {
	let last = path.slice(path.lastIndexOf("/") + 1);
	return last === "" || last.includes(".");
}

export const link = plugin({
	name: "link",
	rules: {
		"link.href.exists": true,
		"link.href.empty": true,
		"link.internal.trailing": true,
		"link.internal.lowercase": true,
		"link.internal.nofollow": true,
		"link.internal.pretty": true,
		"link.internal.absolute": true,
		"link.internal.https": true,
		"link.external.limit": { max: 50 },
		"link.blank.noopener": true,
		"link.blank.noreferrer": true,
		"link.text.exists": true,
		"link.text.vague": {
			words: [
				"click here",
				"here",
				"read more",
				"more",
				"learn more",
				"link",
				"this",
			],
		},
	},
	meta: about.meta({
		"link.href.exists": "A link has an href attribute.",
		"link.href.empty": "A link href is not empty.",
		"link.internal.trailing": "An internal link to a page ends with a slash.",
		"link.internal.lowercase": "An internal link has no uppercase letters.",
		"link.internal.nofollow": 'An internal link does not use rel="nofollow".',
		"link.internal.pretty": 'An internal link does not end with ".html".',
		"link.internal.absolute":
			"An internal link starts with /, //, or a protocol.",
		"link.internal.https":
			"An internal link uses https:// or a root-relative path.",
		"link.external.limit": [
			"warn",
			"A page has at most a number of external links.",
		],
		"link.blank.noopener": 'A link with target="_blank" uses rel="noopener".',
		"link.blank.noreferrer":
			'A link with target="_blank" uses rel="noreferrer".',
		"link.text.exists":
			"A link has text, an aria-label, or an image with alt text.",
		"link.text.vague": [
			"warn",
			'A link text describes its target, unlike "click here".',
		],
	}),
	run(context, document) {
		let externals = 0;
		let seen: Set<string> = new Set();
		let links = document.all("a");

		let { host } = context.options;
		let origin = (host && URL.parse(host)?.hostname) || "";
		let base = URL.parse(context.url ?? "")?.href ?? "http://x.com";

		links.forEach((link) => {
			let href = link.getAttr("href") || "";

			context.assert(
				"link.href.exists",
				link.hasAttr("href"),
				"Must have an `href` attribute",
				link,
			);

			let text = link.text.trim();
			let label =
				text ||
				link.getAttr("aria-label")?.trim() ||
				(link.hasAttr("aria-labelledby") ? "labelled" : "") ||
				link
					.all("img")
					.map((x) => x.getAttr("alt")?.trim() ?? "")
					.join("");

			context.assert(
				"link.text.exists",
				label.length > 0,
				"Must have text, an `aria-label`, or an image with `alt` text",
				link,
			);

			let section = href.startsWith("#");
			let phrase = text
				.toLowerCase()
				.replace(/[^\w\s]/g, "")
				.replace(/\s+/g, " ");
			if (phrase && !section) {
				context.assert(
					"link.text.vague",
					(options) => !options.words.includes(phrase),
					`Must describe the target, not "${text}"`,
					link,
				);
			}

			if (section) return;
			if (/^(mailto|javascript)[:]/.test(href)) return;

			let index = href.indexOf("#");
			if (index !== -1) {
				href = href.substring(0, index);
			}

			if (seen.has(href)) return;
			seen.add(href);

			context.assert(
				"link.href.empty",
				href.trim().length > 0,
				"Must not have empty `href` target",
				link,
			);

			const url = origin ? URL.parse(href, base) : null;
			const isExternal =
				url === null || (url.hostname !== "x.com" && url.hostname !== origin);

			if (isExternal) {
				externals++;
			} else {
				context.assert(
					"link.internal.nofollow",
					link.getAttr("rel") !== "nofollow",
					"Internal links must not include `rel=nofollow`",
					link,
				);

				context.assert(
					"link.internal.lowercase",
					!/[A-Z]/.test(href),
					"Internal links should not include uppercase",
					link,
				);

				context.assert(
					"link.internal.trailing",
					trailing(url.pathname),
					"Internal links must end with a trailing slash",
					link,
				);

				context.assert(
					"link.internal.pretty",
					!/\.html?$/i.test(href),
					'Internal links should not include ".html" suffix',
					link,
				);

				context.assert(
					"link.internal.absolute",
					/^([/]{1,2}|https?:\/\/)/.test(href),
					"Must be an absolute URL format",
					link,
				);

				context.assert(
					"link.internal.https",
					href === "/" || /^https:\/\//.test(href) || /^\/[^/]+/.test(href),
					'Must include "https://" prefix',
					link,
				);
			}

			if (link.getAttr("target") === "_blank") {
				let rel = link.getAttr("rel") || "";

				context.assert(
					"link.blank.noopener",
					rel.includes("noopener"),
					'Must include "rel=noopener" when "target=_blank" in use',
					link,
				);

				context.assert(
					"link.blank.noreferrer",
					rel.includes("noreferrer"),
					'Must include "rel=noreferrer" when "target=_blank" in use',
					link,
				);
			}
		});

		if (externals) {
			context.assert(
				"link.external.limit",
				(o) => externals <= o.max,
				"Exceeded external links maximum",
			);
		}
	},
});
