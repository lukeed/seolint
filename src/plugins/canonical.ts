import type { Plugin } from 'seolint';

interface Canonical {
	'canonical.exists': boolean;
	'canonical.single': boolean;
	'canonical.href.exists': boolean;
	'canonical.href.absolute': boolean;
	'canonical.href.lowercase': boolean;
	'canonical.href.https': boolean;
	'canonical.href.match': boolean | {
		hostname: string;
	};
}

export const canonical: Plugin<Canonical> = function (context, document) {
	let [elem, ...rest] = document.querySelectorAll('link[rel=canonical]');

	context.assert('canonical.exists', elem != null, 'A canonical link must exist');
	context.assert('canonical.single', rest.length === 0, 'Must have only one canonical link');

	let target = elem.getAttribute('href') || '';

	context.assert(
		'canonical.href.exists',
		target.length > 0,
		'Must not have empty `href` target'
	);

	context.assert(
		'canonical.href.absolute',
		/^https?:\/\//.test(target),
		'Must include a URL protocol in target'
	);

	context.assert(
		'canonical.href.lowercase',
		!/[A-Z]/.test(target),
		'Must not include uppercase character(s)'
	);

	context.assert(
		'canonical.href.https',
		/^https:\/\//.test(target),
		'Must point to an "https://" address'
	);

	let { host } = context.options;

	context.assert(
		'canonical.href.match',
		o => target.includes(o.hostname || host || '\0'),
		'Must include the provided `hostname` value'
	);
}
