import type { Config } from "./types";

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
	if (custom.rules) base.rules = { ...base.rules, ...custom.rules };
	base.inputs = custom.inputs || base.inputs;
	base.host = custom.host || base.host;
}
