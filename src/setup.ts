import * as pattern from "./pattern";
import * as plugins from "./plugins";

import type { Config, Dict, Meta, Plugin, Setting, Severity } from "./types";

/** A rule's resolved state: off, or on with a severity and options. */
export type State =
	| false
	| {
			severity: Severity;
			/** `true` for a rule without options. */
			options: true | Dict;
	  };

/** Facts about one rule, for messages and `seolint --rules`. */
export type Info = {
	plugin: string;
	meta: Meta | undefined;
	/** The state when the config does not set the rule. */
	defaults: State;
	state: State;
};

export type Setup = {
	plugins: Plugin[];
	rules: Map<string, Info>;
};

function isPlugin(input: unknown): input is Plugin {
	if (typeof input !== "object" || input === null) return false;
	if (!("name" in input) || typeof input.name !== "string") return false;
	if (!("rules" in input) || typeof input.rules !== "object") return false;
	return (
		input.rules !== null && "run" in input && typeof input.run === "function"
	);
}

function isSeverity(input: unknown): input is Severity {
	return input === "error" || input === "warn";
}

function isDict(input: unknown): input is Dict {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}

/**
 * Apply a config `setting` over a rule's current `state`. `fallback` holds
 * the severity and options to use when the rule is off by default.
 * @throws {TypeError} for a value that is not a {@link Setting}.
 */
function apply(
	rule: string,
	state: State,
	fallback: Exclude<State, false>,
	setting: unknown,
): State {
	let { severity, options } = state || fallback;
	let merged = (custom: Dict) =>
		options === true ? true : { ...options, ...custom };

	if (setting === false) return false;
	if (setting === true) return { severity, options };
	if (isSeverity(setting)) return { severity: setting, options };
	if (isDict(setting)) return { severity, options: merged(setting) };

	if (Array.isArray(setting) && setting.length === 2) {
		let [level, custom] = setting;
		if (isSeverity(level) && isDict(custom)) {
			return { severity: level, options: merged(custom) };
		}
	}

	throw new TypeError(
		`Invalid setting for rule "${rule}": expected a boolean, "error", "warn", options, or [severity, options]`,
	);
}

/**
 * The plugins and rules to lint with. The built-in plugins come first; a
 * config plugin with the same name replaces one. Rule settings apply over
 * each rule's defaults: patterns like `"link.*"` first, then exact names.
 * @throws {Error} for an invalid plugin or setting, a rule that two plugins
 * declare, or a rule name or pattern that no plugin declares.
 */
export function setup(config: Config): Setup {
	let { workers } = config;
	if (workers !== undefined && !(Number.isInteger(workers) && workers > 0)) {
		throw new Error("Invalid `workers` value: expected a positive integer");
	}

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

	let rules = new Map<string, Info>();
	let fallbacks = new Map<string, Exclude<State, false>>();

	for (let x of named.values()) {
		let meta: Record<string, Meta | undefined> = x.meta ?? {};
		for (let [rule, value] of Object.entries(x.rules)) {
			let owner = rules.get(rule);
			if (owner) {
				throw new Error(
					`Rule "${rule}" is declared by plugins "${owner.plugin}" and "${x.name}"`,
				);
			}
			let fallback: Exclude<State, false> = {
				severity: meta[rule]?.severity ?? "error",
				options: typeof value === "object" ? value : true,
			};
			let defaults: State = value === false ? false : fallback;
			fallbacks.set(rule, fallback);
			rules.set(rule, {
				plugin: x.name,
				meta: meta[rule],
				defaults,
				state: defaults,
			});
		}
	}

	let unknown: string[] = [];
	let entries: [string, Setting][] = Object.entries(config.rules ?? {});
	let set = (rule: string, setting: Setting) => {
		let info = rules.get(rule);
		let fallback = fallbacks.get(rule);
		if (info && fallback)
			info.state = apply(rule, info.state, fallback, setting);
	};

	for (let [key, setting] of entries) {
		if (!key.includes("*")) continue;
		let regex = pattern.compile(key);
		let matched = [...rules.keys()].filter((rule) => regex.test(rule));
		if (matched.length === 0) unknown.push(key);
		for (let rule of matched) set(rule, setting);
	}

	for (let [key, setting] of entries) {
		if (key.includes("*")) continue;
		if (rules.has(key)) set(key, setting);
		else unknown.push(key);
	}

	if (unknown.length > 0) {
		let names = unknown.map((x) => `"${x}"`).join(", ");
		throw new Error(
			`Unknown rule${unknown.length > 1 ? "s" : ""} in config: ${names}`,
		);
	}

	return { plugins: [...named.values()], rules };
}
