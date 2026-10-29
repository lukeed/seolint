import { plugin } from "../plugin";
import * as codes from "./codes";
import * as about from "./meta";

/** The HTML spec requires the charset declaration within the first 1024 bytes. */
const CHARSET_LIMIT = 1024;

/**
 * Whether `value` is a well-formed BCP 47 language tag, with an ISO 639-1
 * language, or a three-letter ISO 639-2 or 639-3 language.
 * @example
 * tag("pt-BR"); //=> true
 * tag("en_US"); //=> false
 */
function tag(value: string): boolean {
	try {
		Intl.getCanonicalLocales(value);
	} catch {
		return false;
	}
	let language = value.split("-")[0].toLowerCase();
	return language.length === 3 || codes.languages.has(language);
}

export const html = plugin({
	name: "html",
	rules: {
		"html.doctype": true,
		"html.lang": true,
		"html.charset": true,
		"html.favicon": true,
		"html.refresh": true,
	},
	meta: about.meta({
		"html.doctype": "A page starts with <!doctype html>.",
		"html.lang": "The <html> element has a valid lang attribute.",
		"html.charset": "A page declares the utf-8 encoding near the top.",
		"html.favicon": ["warn", "A page links to a favicon."],
		"html.refresh": ["warn", "A page does not redirect with a meta refresh."],
	}),
	run(context, document) {
		let doctype = document.children.find((x) => x.type === "directive");
		context.assert(
			"html.doctype",
			doctype?.type === "directive" &&
				/^doctype\s+html\s*$/i.test(doctype.value),
			"Must start with <!doctype html>",
		);

		let root = document.find("html");
		let lang = root?.getAttr("lang")?.trim() ?? "";
		context.assert(
			"html.lang",
			lang.length > 0,
			"The <html> element must have a `lang` attribute",
			root,
		);
		if (lang) {
			context.assert(
				"html.lang",
				tag(lang),
				`Must be a valid language tag, such as "en" or "pt-BR", not "${lang}"`,
				root,
			);
		}

		let charset =
			document.find("meta[charset]") ??
			document.find('meta[http-equiv="content-type" i]');
		context.assert(
			"html.charset",
			charset != null,
			'A <meta charset="utf-8"> tag must exist',
		);
		if (charset) {
			let value = (
				charset.getAttr("charset") ??
				/charset\s*=\s*["']?([^\s;"']+)/i.exec(
					charset.getAttr("content") ?? "",
				)?.[1] ??
				""
			).trim();
			context.assert(
				"html.charset",
				value.toLowerCase() === "utf-8",
				`Must use "utf-8", not "${value}"`,
				charset,
			);
			context.assert(
				"html.charset",
				charset.start < CHARSET_LIMIT,
				`Must be within the first ${CHARSET_LIMIT} bytes of the page`,
				charset,
			);
		}

		context.assert(
			"html.favicon",
			document.find("link[rel~=icon i]") != null,
			'A <link rel="icon"> tag must exist',
		);

		for (let node of document.all("meta[http-equiv=refresh i]")) {
			context.report(
				"html.refresh",
				"Must not use a meta refresh; use a server redirect",
				node,
			);
		}
	},
});
