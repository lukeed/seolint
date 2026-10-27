import { plugin } from "../plugin";
import * as about from "./meta";

const STOP = new Set(
	"a an and are as at be by for from has have in is it its of on or our that the this to was we with you your".split(
		" ",
	),
);

/**
 * The meaningful words of `text`: lowercase, without stop words.
 * @example
 * words("The Best Bread in Town"); //=> Set { "best", "bread", "town" }
 */
function words(text: string): Set<string> {
	return new Set(
		text
			.toLowerCase()
			.split(/[^\w]+/)
			.filter((x) => x.length > 0 && !STOP.has(x)),
	);
}

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
		"description.content.length": { min: 50, max: 160 },
	},
	meta: about.meta({
		"description.exists": 'A page has a <meta name="description"> tag.',
		"description.single": "A page has only one description tag.",
		"description.content.empty": "The description is not empty.",
		"description.content.html": "The description has no HTML tags in its text.",
		"description.content.title": [
			"warn",
			"The description shares at least one meaningful word with the title.",
		],
		"description.content.undefined":
			'The description does not include the text "undefined".',
		"description.content.null":
			'The description does not include the text "null".',
		"description.content.length":
			"The description length is within a range of characters.",
	}),
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
			!/<[a-z/!?]/i.test(content),
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
			'Must not include "null" in value',
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
					let found = words(content);
					for (let word of words(title.text)) if (found.has(word)) return true;
					return false;
				},
				"Must include at least one word in the <title> tag.",
				elem,
			);
	},
});
