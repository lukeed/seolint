import type { Plugin } from 'seolint';

interface Image {
	'image.alt.exists': boolean;
	'image.alt.content.html': boolean;
	'image.alt.content.undefined': boolean;
	'image.alt.content.null': boolean;
}

export const image: Plugin<Image> = function (context, document) {
	let images = document.querySelectorAll('img');

	images.forEach(img => {
		let alt = img.getAttribute('alt') || '';

		context.assert(
			'image.alt.exists',
			() => alt.trim().length > 0,
			'Must have an `alt` attribute'
		);

		// TODO
		// let toHTML = context.load('image.alt.content.html');
		// if (toHTML) assert.falsey(alt.inner, 'Must not have HTML content within `alt` value');

		context.assert(
			'image.alt.content.undefined',
			() => !alt.includes('undefined'),
			'Must not include "undefined" in `alt` value'
		);

		context.assert(
			'image.alt.content.null',
			() => !alt.includes('null'),
			'Must not include "null" in `alt` value'
		);
	});
}
