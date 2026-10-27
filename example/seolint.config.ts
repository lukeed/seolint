import { define } from "seolint/config";

import type { Plugin } from "seolint";

/**
 * The <html> element must declare the page language.
 */
const lang: Plugin<{ "lang.exists": boolean }> = (context, document) => {
	let html = document.find("html");
	context.assert(
		"lang.exists",
		Boolean(html?.getAttr("lang")),
		"The <html> element must have a `lang` attribute",
		html,
	);
};

/**
 * Each page needs exactly one <h1>.
 */
const heading: Plugin<{
	"heading.exists": boolean;
	"heading.single": boolean;
}> = (context, document) => {
	let [first, ...rest] = document.all("h1");
	context.assert("heading.exists", first != null, "A page must have an <h1>");
	for (let extra of rest) {
		context.assert(
			"heading.single",
			false,
			"A page must have only one <h1>",
			extra,
		);
	}
};

/**
 * Pages need Open Graph tags for link previews.
 * The `og.image` rule takes a `secure` option, which requires an https:// image.
 */
const opengraph: Plugin<{
	"og.title": boolean;
	"og.image": boolean | { secure?: boolean };
}> = (context, document) => {
	let title = document.find('meta[property="og:title"]');
	context.assert(
		"og.title",
		Boolean(title?.getAttr("content")),
		'A "og:title" meta tag must exist',
	);

	let image = document.find('meta[property="og:image"]');
	context.assert("og.image", image != null, 'A "og:image" meta tag must exist');
	if (!image) return;

	let url = image.getAttr("content") ?? "";
	context.assert(
		"og.image",
		(options) => !options.secure || url.startsWith("https://"),
		'The "og:image" must be an https:// URL',
		image,
	);
};

export default define({
	host: "https://example.com",
	inputs: ["public"],
	plugins: [lang, heading, opengraph],
	rules: {
		"title.content.length": { min: 10, max: 60 },
		"description.content.title": false,
		"og.image": { secure: true },
	},
});
