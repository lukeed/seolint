import { plugin } from "../plugin";
import * as about from "./meta";

/** Elements and the attributes that load a resource. */
const SOURCES: [selector: string, attribute: string][] = [
	["img[src]", "src"],
	["img[srcset]", "srcset"],
	["source[src]", "src"],
	["source[srcset]", "srcset"],
	["script[src]", "src"],
	["link[href]:not([rel~=canonical i]):not([rel~=alternate i])", "href"],
	["iframe[src]", "src"],
	["video[src]", "src"],
	["video[poster]", "poster"],
	["audio[src]", "src"],
	["embed[src]", "src"],
	["object[data]", "data"],
];

export const mixed = plugin({
	name: "mixed",
	rules: {
		"mixed.content": true,
	},
	meta: about.meta("security", {
		"mixed.content": "An https:// page loads no resources over http://.",
	}),
	run(context, document) {
		let page = context.url ?? context.options.host ?? "";
		if (!page.startsWith("https://")) return;

		for (let [selector, attribute] of SOURCES) {
			for (let node of document.all(selector)) {
				let value = node.getAttr(attribute) ?? "";
				context.assert(
					"mixed.content",
					!/(^|[\s,])http:\/\//i.test(value),
					`Must load "${attribute}" over https://, not http://`,
					node,
				);
			}
		}
	},
});
