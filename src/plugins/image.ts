import { plugin } from "../plugin";

export const image = plugin({
	name: "image",
	rules: {
		"image.alt.exists": true,
		"image.alt.content.html": true,
		"image.alt.content.undefined": true,
		"image.alt.content.null": true,
	},
	run(context, document) {
		let images = document.all("img");

		images.forEach((img) => {
			let alt = img.getAttr("alt") || "";

			context.assert(
				"image.alt.exists",
				alt.trim().length > 0,
				"Must have an `alt` attribute",
				img,
			);

			// TODO
			// let toHTML = context.load('image.alt.content.html');
			// if (toHTML) assert.falsey(alt.inner, 'Must not have HTML content within `alt` value');

			context.assert(
				"image.alt.content.undefined",
				alt.indexOf("undefined") === -1,
				'Must not include "undefined" in `alt` value',
				img,
			);

			context.assert(
				"image.alt.content.null",
				alt.indexOf("null") === -1,
				'Must not include "null" in `alt` value',
				img,
			);
		});
	},
});
