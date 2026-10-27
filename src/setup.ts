import * as plugins from "./plugins";

import type { Config, Dict, Plugin, Setting } from "./types";

/** A rule's resolved state: off, on, or on with options. */
export type State = boolean | Dict;

export type Setup = {
	plugins: Plugin[];
	rules: Map<string, State>;
};

function isPlugin(input: unknown): input is Plugin {
	if (typeof input !== "object" || input === null) return false;
	if (!("name" in input) || typeof input.name !== "string") return false;
	if (!("rules" in input) || typeof input.rules !== "object") return false;
	return (
		input.rules !== null && "run" in input && typeof input.run === "function"
	);
}

function apply(defaults: State, setting: Setting): State {
	if (setting === false) return false;
	if (setting === true) return typeof defaults === "object" ? defaults : true;
	return typeof defaults === "object" ? { ...defaults, ...setting } : true;
}

function pattern(input: string): RegExp {
	let escaped = input
		.split("*")
		.map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
	return new RegExp(`^${escaped.join(".*")}$`);
}

/**
 * The plugins and rule states to lint with. The built-in plugins come first;
 * a config plugin with the same name replaces one. Rule settings apply over
 * each rule's defaults: patterns like `"link.*"` first, then exact names.
 * @throws {Error} for rule names or patterns that no plugin declares.
 */
export function setup(config: Config): Setup {
	let named = new Map<string, Plugin>();
	for (let x of plugins.builtins) named.set(x.name, x);
	for (let [i, x] of (config.plugins ?? []).entries()) {
		if (!isPlugin(x)) {
			throw new TypeError(
				`Invalid plugin at plugins[${i}]: expected an object with "name", "rules", and "run", such as plugin() returns`,
			);
		}
		named.set(x.name, x);
	}

	let defaults = new Map<string, State>();
	for (let x of named.values()) {
		for (let [rule, value] of Object.entries(x.rules))
			defaults.set(rule, value);
	}

	let rules = new Map(defaults);
	let unknown: string[] = [];
	let entries = Object.entries(config.rules ?? {});

	for (let [key, setting] of entries) {
		if (!key.includes("*")) continue;
		let regex = pattern(key);
		let matched = [...defaults.keys()].filter((rule) => regex.test(rule));
		if (matched.length === 0) unknown.push(key);
		for (let rule of matched)
			rules.set(rule, apply(defaults.get(rule) ?? true, setting));
	}

	for (let [key, setting] of entries) {
		if (key.includes("*")) continue;
		let base = defaults.get(key);
		if (base === undefined) unknown.push(key);
		else rules.set(key, apply(base, setting));
	}

	if (unknown.length > 0) {
		let names = unknown.map((x) => `"${x}"`).join(", ");
		throw new Error(
			`Unknown rule${unknown.length > 1 ? "s" : ""} in config: ${names}`,
		);
	}

	return { plugins: [...named.values()], rules };
}
