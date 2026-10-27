import * as pattern from "./pattern";

import type { Config, Setting } from "./types";

/**
 * Merge rule settings, where `custom` wins. A pattern in `custom`, such
 * as `"og.*"`, also replaces every earlier setting that it matches, so a
 * config can override a preset's exact rule names with one pattern.
 * @example
 * rules({ "og.title": "error" }, { "og.*": false }); //=> { "og.*": false }
 */
function rules(
	base: Record<string, Setting>,
	custom: Record<string, Setting>,
): Record<string, Setting> {
	let patterns = Object.keys(custom)
		.filter((x) => x.includes("*"))
		.map(pattern.compile);
	let kept = Object.entries(base).filter(
		([name]) =>
			!Object.hasOwn(custom, name) && !patterns.some((re) => re.test(name)),
	);
	return { ...Object.fromEntries(kept), ...custom };
}

/**
 * Merge config objects
 * Overrides default values
 * Priority: rules > plugins
 * @NOTE Mutates `base` object!
 */
export function merge(base: Config, custom: Config): void {
	(custom.presets || []).forEach((x) => merge(base, x));
	if (custom.plugins)
		base.plugins = [...(base.plugins ?? []), ...custom.plugins];
	if (custom.rules) base.rules = rules(base.rules ?? {}, custom.rules);
	if (custom.ignore) base.ignore = [...(base.ignore ?? []), ...custom.ignore];
	base.inputs = custom.inputs || base.inputs;
	base.host = custom.host || base.host;
	if (custom.workers !== undefined) base.workers = custom.workers;
}
