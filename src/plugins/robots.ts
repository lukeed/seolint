import { plugin } from "../plugin";
import * as about from "./meta";

export const robots = plugin({
	name: "robots",
	rules: {
		"robots.noindex": true,
		"robots.nofollow": true,
	},
	meta: about.meta({
		"robots.noindex":
			"A page does not ask search engines to leave it out of results.",
		"robots.nofollow":
			"A page does not ask search engines to ignore its links.",
	}),
	run(context, document) {
		for (let node of document.all(
			"meta[name=robots i], meta[name=googlebot i]",
		)) {
			let tokens = (node.getAttr("content") ?? "")
				.toLowerCase()
				.split(",")
				.map((x) => x.trim());

			context.assert(
				"robots.noindex",
				!tokens.includes("noindex") && !tokens.includes("none"),
				'Must not use "noindex", which removes the page from search results',
				node,
			);
			context.assert(
				"robots.nofollow",
				!tokens.includes("nofollow") && !tokens.includes("none"),
				'Must not use "nofollow", which stops search engines from following links',
				node,
			);
		}
	},
});
