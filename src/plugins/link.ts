import { plugin } from "../plugin";

export const link = plugin({
	name: "link",
	rules: {
		"link.href.exists": true,
		"link.href.empty": true,
		"link.internal.trailing": true,
		"link.internal.lowercase": true,
		"link.internal.nofollow": true,
		"link.internal.pretty": true,
		"link.internal.absolute": true,
		"link.internal.https": true,
		"link.external.limit": { max: 50 },
		"link.blank.noopener": true,
		"link.blank.noreferrer": true,
	},
	run(context, document) {
		let externals = 0;
		let seen: Set<string> = new Set();
		let links = document.all("a");

		let { host } = context.options;
		let origin = host && URL.canParse(host) ? new URL(host).hostname : "";

		links.forEach((link) => {
			let href = link.getAttr("href") || "";

			context.assert(
				"link.href.exists",
				link.hasAttr("href"),
				"Must have an `href` attribute",
				link,
			);

			if (href === "#") return;
			if (/^(mailto|javascript)[:]/.test(href)) return;

			let index = href.indexOf("#");
			if (index !== -1) {
				href = href.substring(0, index);
			}

			if (seen.has(href)) return;
			seen.add(href);

			context.assert(
				"link.href.empty",
				href.trim().length > 0,
				"Must not have empty `href` target",
				link,
			);

			let isExternal = true;

			if (origin && URL.canParse(href, "http://x.com")) {
				let { hostname } = new URL(href, "http://x.com");
				isExternal = hostname !== "x.com" && hostname !== origin;
			}

			if (isExternal) {
				externals++;
			} else {
				context.assert(
					"link.internal.nofollow",
					link.getAttr("rel") !== "nofollow",
					"Internal links must not include `rel=nofollow`",
					link,
				);

				context.assert(
					"link.internal.lowercase",
					!/[A-Z]/.test(href),
					"Internal links should not include uppercase",
					link,
				);

				context.assert(
					"link.internal.trailing",
					/(\S+\.\w+){1,}$/.test(href) || href.endsWith("/"),
					"Internal links must end with a trailing slash",
					link,
				);

				context.assert(
					"link.internal.pretty",
					!/\.html?$/i.test(href),
					'Internal links should not include ".html" suffix',
					link,
				);

				context.assert(
					"link.internal.absolute",
					/^([/]{1,2}|https?:\/\/)/.test(href),
					"Must be an absolute URL format",
					link,
				);

				context.assert(
					"link.internal.https",
					href === "/" || /^https:\/\//.test(href) || /^\/[^/]+/.test(href),
					'Must include "https://" prefix',
					link,
				);
			}

			if (link.getAttr("target") === "_blank") {
				let rel = link.getAttr("rel") || "";

				context.assert(
					"link.blank.noopener",
					rel.includes("noopener"),
					'Must include "rel=noopener" when "target=_blank" in use',
					link,
				);

				context.assert(
					"link.blank.noreferrer",
					rel.includes("noreferrer"),
					'Must include "rel=noreferrer" when "target=_blank" in use',
					link,
				);
			}
		});

		if (externals) {
			context.assert(
				"link.external.limit",
				(o) => externals <= o.max,
				"Exceeded external links maximum",
			);
		}
	},
});
