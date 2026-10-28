import { plugin } from "../plugin";
import * as about from "./meta";

export const image = plugin({
	name: "image",
	rules: {
		"image.alt.exists": true,
		"image.alt.content.html": true,
		"image.alt.content.undefined": true,
		"image.alt.content.null": true,
	},
	meta: about.meta({
		"image.alt.exists":
			'An <img> has an alt attribute. alt="" is allowed, for decorative images.',
		"image.alt.content.html": "The alt text has no HTML tags.",
		"image.alt.content.undefined":
			'The alt text does not include the word "undefined".',
		"image.alt.content.null": 'The alt text does not include the word "null".',
	}),
	run(context, document) {
		let images = document.all("img");

		images.forEach((img) => {
			let alt = img.getAttr("alt") || "";

			context.assert(
				"image.alt.exists",
				img.hasAttr("alt"),
				'Must have an `alt` attribute; use alt="" for decorative images',
				img,
			);

			// TODO
			// let toHTML = context.load('image.alt.content.html');
			// if (toHTML) assert.falsey(alt.inner, 'Must not have HTML content within `alt` value');
			context.assert(
				"image.alt.content.html",
				!/<[a-z/!?]/i.test(alt),
				"Must not have HTML content within `alt` value",
				img,
			);

			context.assert(
				"image.alt.content.undefined",
				!/\bundefined\b/.test(alt),
				'Must not include "undefined" in `alt` value',
				img,
			);

			context.assert(
				"image.alt.content.null",
				!/\bnull\b/.test(alt),
				'Must not include "null" in `alt` value',
				img,
			);
		});
	},
});
