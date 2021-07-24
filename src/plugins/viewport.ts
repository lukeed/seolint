import type { Plugin } from 'seolint';

interface Viewport {
	'viewport.exists': boolean;
	'viewport.single': boolean;
	'viewport.content.empty': boolean;
	'viewport.content.device': boolean;
	'viewport.content.scale': boolean;
}

export const viewport: Plugin<Viewport> = function (context, document) {
	let [elem, ...rest] = document.querySelectorAll('meta[name=viewport]');

	context.assert(
		'viewport.exists',
		elem != null,
		'A "meta[name=viewport]" tag must exist'
	);

	context.assert(
		'viewport.single',
		rest.length === 0,
		'Must have only one "viewport" meta tag'
	);

	let content = elem.getAttribute('content') || '';

	context.assert(
		'viewport.content.empty',
		content.trim().length > 0,
		'Must not have empty "content" value'
	);

	context.assert(
		'viewport.content.device',
		content.includes('width=device-width'),
		'Must include "width=device-width" value',
	);

	context.assert(
		'viewport.content.scale',
		content.includes('initial-scale=1'),
		'Must must include "initial-scale=1" value',
	);
}
