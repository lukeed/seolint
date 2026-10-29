import { plugin } from "../plugin";
import * as directives from "./directives";
import * as about from "./meta";

import type { Node } from "@lukeed/html";

export const robots = plugin({
	name: "robots",
	rules: {
		"robots.noindex": true,
		"robots.nofollow": true,
	},
	meta: about.meta("search", {
		"robots.noindex":
			"A page does not ask search engines to leave it out of results.",
		"robots.nofollow":
			"A page does not ask search engines to ignore its links.",
	}),
	run(context, document) {
		let check = (tokens: string[], where: string, node?: Node) => {
			context.assert(
				"robots.noindex",
				!directives.noindex(tokens),
				`Must not use "noindex"${where}, which removes the page from search results`,
				node,
			);
			context.assert(
				"robots.nofollow",
				!tokens.includes("nofollow") && !tokens.includes("none"),
				`Must not use "nofollow"${where}, which stops search engines from following links`,
				node,
			);
		};

		for (let node of directives.tags(document)) {
			check(directives.meta(node.getAttr("content") ?? ""), "", node);
		}

		let header = context.headers?.get("x-robots-tag");
		if (header) check(directives.header(header), " in the X-Robots-Tag header");
	},
});
