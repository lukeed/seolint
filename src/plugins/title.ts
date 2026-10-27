import { plugin } from "../plugin";

// TODO: stop words
export const title = plugin({
	name: "title",
	rules: {
		"title.exists": true,
		"title.single": true,
		"title.content.html": true,
		"title.content.undefined": true,
		"title.content.null": true,
		"title.content.length": { min: 10, max: 300 },
	},
	run(context, document) {
		let [elem, ...rest] = document.all("head>title");

		context.assert("title.exists", elem != null, "A title tag must exist");
		context.assert(
			"title.single",
			rest.length === 0,
			"Must have only one title tag",
		);
		if (!elem) return;

		let text = elem.text;

		context.assert(
			"title.content.html",
			!/<[a-z/!?]/i.test(text),
			"Must not include HTML content",
			elem,
		);

		context.assert(
			"title.content.undefined",
			text.indexOf("undefined") === -1,
			'Must not include "undefined" in `title` value',
			elem,
		);

		context.assert(
			"title.content.null",
			text.indexOf("null") === -1,
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
