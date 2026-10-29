import { plugin } from "../plugin";
import * as about from "./meta";

/**
 * Whether `value` is a JSON object, not an array or a primitive.
 */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Whether a JSON-LD node has a `@type`, or a `@graph` of nodes that each have one.
 */
function typed(node: Record<string, unknown>): boolean {
	let graph = node["@graph"];
	if (Array.isArray(graph)) {
		return graph.length > 0 && graph.every((x) => isObject(x) && "@type" in x);
	}
	return "@type" in node;
}

export const jsonld = plugin({
	name: "jsonld",
	rules: {
		"jsonld.valid": true,
	},
	meta: about.meta({
		"jsonld.valid":
			"Each JSON-LD script is valid JSON, with an @context and an @type.",
	}),
	run(context, document) {
		for (let node of document.all('script[type="application/ld+json" i]')) {
			try {
				var data: unknown = JSON.parse(node.text);
			} catch {
				context.report("jsonld.valid", "Must be valid JSON", node);
				continue;
			}

			let items = Array.isArray(data) ? data : [data];
			if (items.length === 0 || !items.every(isObject)) {
				context.report(
					"jsonld.valid",
					"Must be an object, or an array of objects",
					node,
				);
				continue;
			}

			context.assert(
				"jsonld.valid",
				items.every((x) => "@context" in x),
				"Must have an @context, such as https://schema.org",
				node,
			);
			context.assert(
				"jsonld.valid",
				items.every(typed),
				"Must have an @type, such as Article",
				node,
			);
		}
	},
});
