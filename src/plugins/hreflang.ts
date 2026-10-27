import { plugin } from "../plugin";
import * as about from "./meta";

/** A language, with an optional script and region, such as `en`, `zh-Hant`, or `pt-BR`. */
const CODE = /^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i;

export const hreflang = plugin({
	name: "hreflang",
	rules: {
		"hreflang.code": true,
		"hreflang.absolute": true,
		"hreflang.default": true,
	},
	meta: about.meta({
		"hreflang.code":
			"An hreflang value is a valid language code, or x-default.",
		"hreflang.absolute": "An hreflang link uses an absolute URL.",
		"hreflang.default": [
			"warn",
			"Pages with hreflang links also have an x-default link.",
		],
	}),
	run(context, document) {
		let links = document.all("link[rel~=alternate][hreflang]");
		if (links.length === 0) return;

		for (let link of links) {
			let code = link.getAttr("hreflang") ?? "";
			context.assert(
				"hreflang.code",
				CODE.test(code),
				`Must be a valid language code, not "${code}"`,
				link,
			);
			context.assert(
				"hreflang.absolute",
				/^https?:\/\//.test(link.getAttr("href") ?? ""),
				"Must link to an absolute URL",
				link,
			);
		}

		context.assert(
			"hreflang.default",
			links.some((x) => x.getAttr("hreflang")?.toLowerCase() === "x-default"),
			'Must include an hreflang="x-default" link',
			links[0],
		);
	},
});
