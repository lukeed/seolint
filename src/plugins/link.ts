import type { Plugin } from 'seolint';

interface Link {
	'link.href.empty': boolean;

	'link.internal.trailing': boolean;
	'link.internal.lowercase': boolean;
	'link.internal.nofollow': boolean;
	'link.internal.pretty': boolean;
	'link.internal.absolute': boolean;
	'link.internal.https': boolean;

	'link.external.limit': boolean | {
		max: number
	};

	'link.blank.noopener': boolean;
	'link.blank.noreferrer': boolean;
}

export const link: Plugin<Link> = function (context, document) {
	let externals = 0;
	let seen: Set<string> = new Set;
	let links = document.querySelectorAll('a[href]');

	let { host } = context.options;
	if (!host) console.warn('! cannot run `link.internal` rules without a known `host` value');

	links.forEach(link => {
		let href = link.getAttribute('href') || '';

		if (href === '#') return;
		if (/^(mailto|javascript)[:]/.test(href)) return;

		let index = href.indexOf('#');
		if (index !== -1) {
			href = href.substring(0, index);
		}

		if (seen.has(href)) return;
		seen.add(href);

		context.assert(
			'link.href.empty',
			href.trim().length > 0,
			'Must not have empty `href` target'
		);

		let isExternal = true;

		if (host) {
			let { hostname } = new URL(href, 'http://x.com');
			isExternal = hostname !== 'x.com' && hostname !== host;
		}

		if (isExternal) {
			externals++;
		} else {
			context.assert(
				'link.internal.nofollow',
				link.getAttribute('rel') !== 'nofollow',
				'Internal links must not include `rel=nofollow`'
			);

			context.assert(
				'link.internal.lowercase',
				!/[A-Z]/.test(href),
				'Internal links should not include uppercase'
			);

			context.assert(
				'link.internal.trailing',
				/(\S+\.\w+){1,}$/.test(href) || href.endsWith('/'),
				'Internal links must end with a trailing slash'
			);

			context.assert(
				'link.internal.pretty',
				!/\.html?$/i.test(href),
				'Internal links should not include ".html" suffix'
			);

			context.assert(
				'link.internal.absolute',
				/^([/]{1,2}|https?:\/\/)/.test(href),
				'Must be an absolute URL format'
			);

			context.assert(
				'link.internal.https',
				href === '/' || /^https:\/\//.test(href) || /^\/[^/]+/.test(href),
				'Must include "https://" prefix'
			);

			if (link.getAttribute('target') === '_blank') {
				let rel = link.getAttribute('rel') || '';

				context.assert(
					'link.blank.noopener',
					rel.includes('noopener'),
					'Must include "rel=noopener" when "target=_blank" in use'
				);

				context.assert(
					'link.blank.noreferrer',
					rel.includes('noreferrer'),
					'Must include "rel=noreferrer" when "target=_blank" in use'
				);
			}
		}
	});

	if (externals) {
		context.assert(
			'link.external.limit',
			o => externals <= (o.max || 50),
			'Exceeded external links maximum'
		);
	}
}
