import { plugin } from "../plugin";
import * as markup from "./markup";
import * as about from "./meta";

// TODO: stop words
export const title = plugin({
	name: "title",
	rules: {
		"title.exists": true,
		"title.single": true,
		"title.content.html": true,
		"title.content.undefined": true,
		"title.content.null": true,
		"title.content.length": { min: 10, max: 60 },
	},
	meta: about.meta({
		"title.exists": "A page has a <title> element in its <head>.",
		"title.single": "A page has only one <title> element.",
		"title.content.html": "The title has no HTML tags in its text.",
		"title.content.undefined":
			'The title does not include the word "undefined".',
		"title.content.null": 'The title does not include the word "null".',
		"title.content.length": "The title length is within a range of characters.",
	}),
	run(context, document) {
		let [elem, ...rest] = document.all("head>title");

		context.assert("title.exists", elem != null, "A title tag must exist");
		context.assert(
			"title.single",
			rest.length === 0,
			"Must have only one title tag",
		);
		if (!elem) return;

		let text = elem.text.replace(/\s+/g, " ").trim();

		context.assert(
			"title.content.html",
			!markup.test(text),
			"Must not include HTML content",
			elem,
		);

		context.assert(
			"title.content.undefined",
			!/\bundefined\b/.test(text),
			'Must not include "undefined" in `title` value',
			elem,
		);

		context.assert(
			"title.content.null",
			!/\bnull\b/.test(text),
			'Must not include "null" in `title` value',
			elem,
		);

		let rule = context.load("title.content.length");

		if (rule) {
			let length = text.length;

			let { min, max } = rule;

			if (length < min)
				context.report(
					"title.content.length",
					`Must not have less than ${min} characters`,
					elem,
				);
			else if (length > max)
				context.report(
					"title.content.length",
					`Must not have more than ${max} characters`,
					elem,
				);
		}
	},
});
