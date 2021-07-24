import type { Context } from 'seolint';

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
export function title(context: Context<Title>, document: HTMLElement) {
	let [elem, ...rest] = document.querySelectorAll('title');

	context.assert(
		'title.exists',
		() => elem != null,
		'A title tag must exist'
	);

	context.assert(
		'title.single',
		() => rest.length === 0,
		'Must have only one title tag'
	);

	let text = elem.innerText;

	context.assert(
		'title.content.html',
		() => text === elem.innerHTML,
		'Must not include HTML content'
	);

	context.assert(
		'title.content.undefined',
		() => !text.includes('undefined'),
		'Must not include "undefined" in `title` value'
	);

	context.assert(
		'title.content.null',
		() => !text.includes('null'),
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
