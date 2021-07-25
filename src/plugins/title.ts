import type { Plugin } from 'seolint';

interface Title {
	'title.exists': boolean;
	'title.single': boolean;
	'title.content.html': boolean;
	'title.content.undefined': boolean;
	'title.content.null': boolean;
	'title.content.length': boolean | {
		min?: number;
		max?: number;
	};
}

// TODO: stop words
export const title: Plugin<Title> = function (context, document) {
	let [elem, ...rest] = document.querySelectorAll('head>title');

	context.assert('title.exists', elem != null, 'A title tag must exist');
	context.assert('title.single', rest.length === 0, 'Must have only one title tag');

	let text = (elem as HTMLTitleElement).innerText;

	context.assert(
		'title.content.html',
		text === elem.innerHTML,
		'Must not include HTML content'
	);

	context.assert(
		'title.content.undefined',
		text.indexOf('undefined') === -1,
		'Must not include "undefined" in `title` value'
	);

	context.assert(
		'title.content.null',
		text.indexOf('null') === -1,
		'Must not include "null" in `title` value'
	);

	let rule = context.load('title.content.length');

	if (rule) {
		let length = text.length;

		let config = rule === true ? {} : rule;
		let { min, max } = { min: 10, max: 300, ...config };

		if (length < min) context.report('title.content.length', `Must not have less than ${min} characters`);
		else if (length > max) context.report('title.content.length', `Must not have more than ${max} characters`);
	}
}
