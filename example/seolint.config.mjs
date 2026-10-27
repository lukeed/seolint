/**
 * The <html> element must declare the page language.
 * @type {import("seolint").Plugin<{ "lang.exists": boolean }>}
 */
function lang(context, document) {
	let html = document.find("html");
	context.assert(
		"lang.exists",
		Boolean(html?.getAttr("lang")),
		"The <html> element must have a `lang` attribute",
		html,
	);
}

/**
 * Each page needs exactly one <h1>.
 * @type {import("seolint").Plugin<{ "heading.exists": boolean; "heading.single": boolean }>}
 */
function heading(context, document) {
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
}

/**
 * Pages need Open Graph tags for link previews.
 * The `og.image` rule takes a `secure` option, which requires an https:// image.
 * @type {import("seolint").Plugin<{ "og.title": boolean; "og.image": boolean | { secure?: boolean } }>}
 */
function opengraph(context, document) {
	let title = document.find('meta[property="og:title"]');
	context.assert(
		"og.title",
		Boolean(title?.getAttr("content")),
		'A "og:title" meta tag must exist',
	);

	let image = document.find('meta[property="og:image"]');
	context.assert("og.image", image != null, 'A "og:image" meta tag must exist');
	if (!image) return;

	context.assert(
		"og.image",
		(options) =>
			!options.secure ||
			(image.getAttr("content") ?? "").startsWith("https://"),
		'The "og:image" must be an https:// URL',
		image,
	);
}

/** @type {import("seolint").Config} */
export default {
	host: "https://example.com",
	inputs: ["public"],
	plugins: [lang, heading, opengraph],
	rules: {
		"title.content.length": { min: 10, max: 60 },
		"description.content.title": false,
		"og.image": { secure: true },
	},
};
