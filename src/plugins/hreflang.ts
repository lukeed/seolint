import { plugin } from "../plugin";
import * as codes from "./codes";
import * as about from "./meta";

/**
 * Whether `value` is an hreflang value that Google supports: `x-default`, or
 * an ISO 639-1 language with an optional ISO 15924 script and ISO 3166-1 region.
 * @example
 * valid("zh-Hant-TW"); //=> true
 * valid("en-UK"); //=> false
 */
function valid(value: string): boolean {
	if (value.toLowerCase() === "x-default") return true;
	let match = /^([a-z]{2})(?:-([a-z]{4}))?(?:-([a-z]{2}))?$/i.exec(value);
	if (!match) return false;
	let [, language, script, region] = match;
	return (
		codes.languages.has(language.toLowerCase()) &&
		(!script ||
			codes.scripts.has(
				script[0].toUpperCase() + script.slice(1).toLowerCase(),
			)) &&
		(!region || codes.regions.has(region.toUpperCase()))
	);
}

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
		let links = document.all("link[rel~=alternate i][hreflang]");
		if (links.length === 0) return;

		for (let link of links) {
			let code = link.getAttr("hreflang") ?? "";
			context.assert(
				"hreflang.code",
				valid(code),
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
