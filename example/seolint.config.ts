import * as config from "seolint/config";

/**
 * Titles name the brand, so search results show who the page is from.
 */
const brand = config.plugin({
	name: "brand",
	rules: { "brand.title": { name: "" } },
	meta: {
		"brand.title": { description: "The title includes the brand name." },
	},
	run(context, document) {
		let title = document.find("title");
		context.assert(
			"brand.title",
			(options) => !options.name || (title?.text ?? "").includes(options.name),
			"The title must include the brand name",
			title,
		);
	},
});

/**
 * Pages need enough text for search engines to understand them.
 * A warning by default, set in `meta`.
 */
const words = config.plugin({
	name: "words",
	rules: { "words.min": { min: 20 } },
	meta: {
		"words.min": {
			description: "The <main> element has a minimum number of words.",
			severity: "warn",
		},
	},
	run(context, document) {
		let main = document.find("main");
		let count = (main?.text ?? "").split(/\s+/).filter(Boolean).length;
		context.assert(
			"words.min",
			(options) => count >= options.min,
			`Must have more words; found ${count}`,
			main,
		);
	},
});

export default config.define({
	host: "https://example.com",
	inputs: ["public"],
	plugins: [brand, words],
	rules: {
		"brand.title": { name: "Bongo Bakery" },
		"description.content.title": false,
		"link.external.limit": ["warn", { max: 10 }],
		"og.*": "error",
	},
});
