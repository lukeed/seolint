import { plugin } from "../plugin";
import * as about from "./meta";

export const heading = plugin({
	name: "heading",
	rules: {
		"heading.exists": true,
		"heading.single": true,
		"heading.order": true,
	},
	meta: about.meta({
		"heading.exists": "A page has an <h1>.",
		"heading.single": "A page has only one <h1>.",
		"heading.order": [
			"warn",
			"Headings start at <h1> or <h2>, and do not skip levels, such as an <h4> after an <h2>.",
		],
	}),
	run(context, document) {
		let [first, ...rest] = document.all("h1");
		context.assert("heading.exists", first != null, "A page must have an <h1>");
		for (let extra of rest) {
			context.report("heading.single", "A page must have only one <h1>", extra);
		}

		let previous = 0;
		for (let node of document.all("h1, h2, h3, h4, h5, h6")) {
			let level = Number(node.name[1]);
			if (previous === 0 && level > 2) {
				context.report(
					"heading.order",
					`Must start at <h1> or <h2>, not <h${level}>`,
					node,
				);
			} else if (previous > 0 && level > previous + 1) {
				context.report(
					"heading.order",
					`Must not skip from <h${previous}> to <h${level}>`,
					node,
				);
			}
			previous = level;
		}
	},
});
