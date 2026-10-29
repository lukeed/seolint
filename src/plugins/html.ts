import { plugin } from "../plugin";
import * as about from "./meta";

/** The HTML spec requires the charset declaration within the first 1024 bytes. */
const CHARSET_LIMIT = 1024;

export const html = plugin({
	name: "html",
	rules: {
		"html.doctype": true,
		"html.lang": true,
		"html.charset": true,
		"html.favicon": true,
	},
	meta: about.meta({
		"html.doctype": "A page starts with <!doctype html>.",
		"html.lang": "The <html> element has a lang attribute.",
		"html.charset": "A page declares its character encoding near the top.",
		"html.favicon": ["warn", "A page links to a favicon."],
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
		context.assert(
			"html.lang",
			Boolean(root?.getAttr("lang")?.trim()),
			"The <html> element must have a `lang` attribute",
			root,
		);

		let charset =
			document.find("meta[charset]") ??
			document.find('meta[http-equiv="content-type" i]');
		context.assert(
			"html.charset",
			charset != null,
			'A <meta charset="utf-8"> tag must exist',
		);
		if (charset) {
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
	},
});
