import { plugin } from "../plugin";
import * as build from "./build";
import * as about from "./meta";

import type { Position } from "../types";

const SELF = "seolint.invalid";

/** An internal link, for the checks that compare it with the built files. */
type Internal = {
	/** The URL path of the target, without the search or hash. */
	path: string;
	position: Position;
};

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
		"link.internal.trailing":
			"An internal link ends with a slash for a folder page, and without one for a file page.",
		"link.internal.lowercase": [
			"warn",
			"An internal link has no uppercase letters.",
		],
		"link.internal.nofollow": 'An internal link does not use rel="nofollow".',
		"link.internal.pretty": [
			"error",
			'An internal link does not end with ".html".',
			"off",
		],
		"link.internal.absolute": [
			"error",
			"An internal link starts with /, //, or a protocol.",
			"off",
		],
		"link.internal.https":
			"An internal link uses https:// or a root-relative path.",
		"link.external.limit": [
			"warn",
			"A page has at most a number of external links.",
			"off",
		],
		"link.blank.noopener": [
			"error",
			'A link with target="_blank" uses rel="noopener".',
			"off",
		],
		"link.blank.noreferrer": [
			"error",
			'An external link with target="_blank" uses rel="noreferrer".',
			"off",
		],
		"link.text.exists":
			"A link has text, an aria-label, or an image with alt text.",
		"link.text.vague": [
			"warn",
			'A link text describes its target, unlike "click here".',
		],
	}),
	run(context, document) {
		let externals = 0;
		let internals: Internal[] = [];
		let seen: Set<string> = new Set();
		let links = document.all("a");

		let { host } = context.options;
		let origin = (host && URL.parse(host)?.hostname) || "";
		let base = URL.parse(context.url ?? "")?.href ?? `http://${SELF}`;

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

			const url = URL.parse(href, base);
			const isExternal =
				url === null ||
				(url.hostname !== SELF && (!origin || url.hostname !== origin));

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

				if (context.url || href.startsWith("/")) {
					internals.push({
						path: url.pathname,
						position: document.position(link.start),
					});
				}

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

				if (isExternal)
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

		return internals;
	},
	async finish(site, pages) {
		if (site.roots.length === 0 || !site.load("link.internal.trailing")) return;
		let known = await build.files(site.roots);
		for (let page of pages) {
			for (let { path, position } of page.data) {
				let shape = build.shape(known, path);
				let slash = path.endsWith("/");
				if (shape === "folder" && !slash) {
					site.report(
						"link.internal.trailing",
						`Must end with a slash, as ${path}/, because the page is a folder`,
						page.input,
						position,
					);
				} else if (shape === "file" && slash) {
					site.report(
						"link.internal.trailing",
						`Must not end with a slash, as ${path.slice(0, -1)}, because the page is a file`,
						page.input,
						position,
					);
				}
			}
		}
	},
});
