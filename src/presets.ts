import * as plugins from "./plugins";

import type { Config, Meta, Setting } from "./types";

function warnings(): Record<string, Setting> {
	let output: Record<string, Setting> = {};
	for (let plugin of plugins.builtins) {
		let meta: Record<string, Meta | undefined> = plugin.meta ?? {};
		for (let rule of Object.keys(plugin.rules)) {
			let info = meta[rule];
			if (info?.severity === "warn" && !info.off) output[rule] = "error";
		}
	}
	return output;
}

/**
 * Every built-in rule that defaults to a warning becomes an error, such as
 * the Open Graph tags, `heading.order`, and the sitemap.
 * @example
 * export default define({ presets: [presets.strict] });
 */
export const strict: Config = {
	rules: warnings(),
};

/**
 * Only the rules that directly affect search results: the title, the
 * description, the canonical link, robots, hreflang, the `<h1>`, image
 * `alt` text, the mobile viewport, working links, and unique titles and
 * descriptions, without style rules. Useful to adopt seolint on a large
 * existing site.
 * @example
 * export default define({ presets: [presets.essentials] });
 */
export const essentials: Config = {
	rules: {
		"*": false,
		"title.*": true,
		"description.*": true,
		"canonical.*": true,
		"robots.*": true,
		"hreflang.*": true,
		"heading.exists": true,
		"image.alt.exists": true,
		"viewport.exists": true,
		"viewport.content.device": true,
		"link.href.*": true,
		"site.title.unique": true,
		"site.description.unique": true,
		"site.link.exists": true,
		"site.canonical.exists": true,
		"site.robots.noindex": true,
		"#style": false,
	},
};

/**
 * For staging and preview deploys: allows `noindex` and `nofollow`, and
 * turns off checks that compare against the production site, such as
 * `robots.txt`, the sitemap, and canonical links that point to production.
 * @example
 * let staging = process.env.DEPLOY_ENV === "staging";
 * export default define({ presets: staging ? [presets.staging] : [presets.strict] });
 */
export const staging: Config = {
	rules: {
		"robots.*": false,
		"site.robots": false,
		"site.robots.noindex": false,
		"site.sitemap": false,
		"site.sitemap.entries": false,
		"canonical.href.self": false,
		"canonical.href.match": false,
		"og.url": false,
		"hreflang.self": false,
	},
};
