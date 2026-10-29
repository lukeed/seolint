import { plugin } from "../plugin";
import * as address from "./address";
import * as about from "./meta";

export const og = plugin({
	name: "og",
	rules: {
		"og.title": true,
		"og.description": true,
		"og.image": true,
		"og.image.secure": true,
		"og.url": true,
	},
	meta: about.meta({
		"og.title": ["warn", "A page has an og:title, for link previews."],
		"og.description": [
			"warn",
			"A page has an og:description, for link previews.",
		],
		"og.image": ["warn", "A page has an og:image, for link previews."],
		"og.image.secure": ["warn", "The og:image is an absolute https:// URL."],
		"og.url": ["warn", "A page has an og:url that matches its canonical URL."],
	}),
	run(context, document) {
		let content = (property: string) => {
			let node = document.find(`meta[property="${property}"]`);
			return { node, value: node?.getAttr("content")?.trim() ?? "" };
		};

		let title = content("og:title");
		context.assert(
			"og.title",
			title.value.length > 0,
			'A "og:title" meta tag must exist',
			title.node,
		);

		let summary = content("og:description");
		context.assert(
			"og.description",
			summary.value.length > 0,
			'A "og:description" meta tag must exist',
			summary.node,
		);

		let image = content("og:image");
		context.assert(
			"og.image",
			image.value.length > 0,
			'A "og:image" meta tag must exist',
			image.node,
		);
		if (image.value) {
			context.assert(
				"og.image.secure",
				image.value.startsWith("https://"),
				'The "og:image" must be an absolute https:// URL',
				image.node,
			);
		}

		let url = content("og:url");
		let canonical =
			document.find("link[rel~=canonical i]")?.getAttr("href") ?? context.url;
		context.assert(
			"og.url",
			url.value.length > 0,
			'A "og:url" meta tag must exist',
			url.node,
		);
		if (url.value && canonical) {
			context.assert(
				"og.url",
				address.normalize(url.value) === address.normalize(canonical),
				`The "og:url" must match the canonical URL, ${canonical}`,
				url.node,
			);
		}
	},
});
