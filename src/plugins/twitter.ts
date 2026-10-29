import { plugin } from "../plugin";
import * as about from "./meta";

const CARDS = ["summary", "summary_large_image", "app", "player"];

export const twitter = plugin({
	name: "twitter",
	rules: {
		"twitter.card": true,
	},
	meta: about.meta({
		"twitter.card": [
			"warn",
			"A page has a valid twitter:card, for link previews.",
		],
	}),
	run(context, document) {
		let node = document.find('meta[name="twitter:card" i]');
		let value = node?.getAttr("content")?.trim() ?? "";
		context.assert(
			"twitter.card",
			value.length > 0,
			'A "twitter:card" meta tag must exist',
			node,
		);
		if (value) {
			context.assert(
				"twitter.card",
				CARDS.includes(value),
				`Must be one of: ${CARDS.join(", ")}`,
				node,
			);
		}
	},
});
