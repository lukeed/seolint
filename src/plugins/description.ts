import type { Plugin } from 'seolint';

interface Description {
	'description.exists': boolean;
	'description.single': boolean;
	'description.content.empty': boolean;
	'description.content.html': boolean;
	'description.content.title': boolean;
	'description.content.undefined': boolean;
	'description.content.null': boolean;
	'description.content.length': boolean | {
		min?: number;
		max?: number;
	};
}

export const description: Plugin<Description> = function (context, document) {
	let [elem, ...rest] = document.querySelectorAll('meta[name=description]');

	context.assert('description.exists', elem != null, 'A "meta[name=description]" must exist');
	context.assert('description.single', rest.length === 0, 'Must have only one description meta tag');

	let content = (elem.getAttribute('content') || '').trim();

	context.assert(
		'description.content.empty',
		content.length > 0,
		'Must not be empty'
	);

	// TODO: html chars
	context.assert(
		'description.content.html',
		!elem.innerHTML,
		'Must not include HTML content'
	);

	context.assert(
		'description.content.undefined',
		content.indexOf('undefined') === -1,
		'Must not include "undefined" in value'
	);

	context.assert(
		'description.content.null',
		content.indexOf('null') === -1,
		'Must not include "null" in  value'
	);

	let rule = context.load('description.content.length');

	if (rule) {
		let length = content.length;

		let config = rule === true ? {} : rule;
		let { min, max } = { min: 10, max: 300, ...config };

		if (length < min) context.report('description.content.length', `Must not have less than ${min} characters`);
		else if (length > max) context.report('description.content.length', `Must not have more than ${max} characters`);
	}

	let title = document.querySelector('title');

	if (title) context.assert(
		'description.content.title',
		() => {
			let words1 = new Set(content.toLowerCase().split(/[^\w]+/g));
			let words2 = new Set(title!.innerText.trim().toLowerCase().split(/[^\w]+/g));
			for (let w of words2) if (words1.has(w)) return true;
			return false;
		},
		'Must include at least one word in the <title> tag.'
	);
}
