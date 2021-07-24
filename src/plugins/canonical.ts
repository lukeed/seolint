import type { Plugin } from 'seolint';

interface Canonical {
	'canonical.exists': boolean;
	'canonical.single': boolean;
	'canonical.href.exists': boolean;
	'canonical.href.absolute': boolean;
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
	context.assert('canonical.href.exists', target.length > 0, 'Must not have empty `href` target');

	context.assert('canonical.href.absolute', /^https?:\/\//.test(target), 'Must point to an absolute URL target');
	context.assert('canonical.href.https', /^https:\/\//.test(target), 'Must point to an "https://" address');

	context.assert(
		'canonical.href.match',
		o => target.includes(o.hostname),
		'Must include the provided `hostname` value'
	);
}
