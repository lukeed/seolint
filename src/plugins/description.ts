import { plugin } from "../plugin";

export const description = plugin({
	name: "description",
	rules: {
		"description.exists": true,
		"description.single": true,
		"description.content.empty": true,
		"description.content.html": true,
		"description.content.title": true,
		"description.content.undefined": true,
		"description.content.null": true,
		"description.content.length": { min: 10, max: 300 },
	},
	run(context, document) {
		let [elem, ...rest] = document.all("meta[name=description]");

		context.assert(
			"description.exists",
			elem != null,
			'A "meta[name=description]" must exist',
		);
		context.assert(
			"description.single",
			rest.length === 0,
			"Must have only one description meta tag",
			rest[0],
		);
		if (!elem) return;

		let content = (elem.getAttr("content") || "").trim();

		context.assert(
			"description.content.empty",
			content.length > 0,
			"Must not be empty",
			elem,
		);

		// TODO: html chars
		context.assert(
			"description.content.html",
			!elem.html,
			"Must not include HTML content",
			elem,
		);

		context.assert(
			"description.content.undefined",
			content.indexOf("undefined") === -1,
			'Must not include "undefined" in value',
			elem,
		);

		context.assert(
			"description.content.null",
			content.indexOf("null") === -1,
			'Must not include "null" in  value',
			elem,
		);

		let rule = context.load("description.content.length");

		if (rule) {
			let length = content.length;

			let { min, max } = rule;

			if (length < min)
				context.report(
					"description.content.length",
					`Must not have less than ${min} characters`,
					elem,
				);
			else if (length > max)
				context.report(
					"description.content.length",
					`Must not have more than ${max} characters`,
					elem,
				);
		}

		let title = document.find("title");

		if (title)
			context.assert(
				"description.content.title",
				() => {
					let words1 = new Set(content.toLowerCase().split(/[^\w]+/g));
					let words2 = new Set(
						title.text
							.trim()
							.toLowerCase()
							.split(/[^\w]+/g),
					);
					for (let w of words2) if (words1.has(w)) return true;
					return false;
				},
				"Must include at least one word in the <title> tag.",
				elem,
			);
	},
});
