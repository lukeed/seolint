import { readdir } from "node:fs/promises";
import { dirname, join, resolve as absolute } from "node:path";
import { pathToFileURL } from "node:url";

import * as merger from "./merge";
import * as origin from "./origin";
import * as setup from "./setup";

import type * as plugins from "./plugins";
import type { Argv, Category, Config, Plugin, Rules, Severity } from "./types";

export { plugin } from "./plugin";
export type {
	Argv,
	Category,
	Config,
	Meta,
	Page,
	Plugin,
	Position,
	Rules,
	Setting,
	Severity,
	Site,
} from "./types";

type Builtin = (typeof plugins.builtins)[number];
type RulesOf<P> = P extends Plugin<infer T> ? T : never;
type Keys<U> = U extends unknown ? keyof U & string : never;
type Value<U, K extends string> = U extends unknown
	? K extends keyof U
		? U[K]
		: never
	: never;

/**
 * Settings for the rules of plugins `P`: each known rule name takes a boolean
 * or partial options, and each pattern with `*`, or category with `#`, takes
 * a boolean or a severity.
 */
type SettingOf<V> =
	| boolean
	| Severity
	| ([Exclude<V, boolean>] extends [never]
			? never
			: | Partial<Exclude<V, boolean>>
				| [Severity, Partial<Exclude<V, boolean>>]);

type Settings<U> = {
	[K in Keys<U>]?: SettingOf<Value<U, K>>;
} & {
	[pattern: `${string}*${string}`]: boolean | Severity;
} & {
	[K in `#${Category}`]?: boolean | Severity;
};

declare const plugged: unique symbol;

/** A config from {@link define}, which remembers its plugins for the configs that use it as a preset. */
export type Defined<X extends Plugin = never> = Config & {
	readonly [plugged]?: X;
};

type PluginsOf<C> = C extends { readonly [plugged]?: infer X extends Plugin }
	? X
	: never;

const HTTP = /^https?:\/\//;

const priority = [
	"seolint.config.ts",
	"seolint.config.mjs",
	"seolint.config.cjs",
	"seolint.config.js",
];

/**
 * Traverse upwards until find a config file
 * @NOTE Does not leave `root` directory
 * @see (modified) lukeed/escalade
 */
export async function find(
	root: string,
	start: string,
): Promise<string | undefined> {
	let dir = absolute(root, start);
	let files = new Set(await readdir(dir));

	for (let name of priority) {
		if (files.has(name)) {
			return join(dir, name);
		}
	}

	dir = dirname(dir);

	if (dir.startsWith(root)) {
		return find(root, dir);
	}
}

export async function load(root: string): Promise<Config> {
	let output: Config = {
		host: "",
		inputs: [],
		plugins: [],
		rules: {},
	};

	let file = await find(root, ".");

	if (file) {
		try {
			var config = await import(pathToFileURL(file).href);
		} catch (err) {
			let code = err instanceof Error && "code" in err ? err.code : undefined;
			if (code !== "ERR_UNKNOWN_FILE_EXTENSION") throw err;
			throw new Error(`Loading "${file}" needs Node 22.18 or later, or Bun`, {
				cause: err,
			});
		}
		merger.merge(output, config.default || config);
		origin.remember(output, file);
	}

	return output;
}

/**
 * Type a config object. Use it as the default export of `seolint.config.ts`.
 * Rule names and options are checked against the built-in plugins and `plugins`.
 * @example
 * export default define({ host: "https://example.com", inputs: ["public"] });
 */
export function define<
	const P extends readonly Plugin[] = [],
	const S extends readonly Config[] = [],
>(
	config: Omit<Config, "plugins" | "presets" | "rules"> & {
		plugins?: P;
		presets?: S;
		rules?: Settings<RulesOf<P[number] | PluginsOf<S[number]> | Builtin>>;
	},
): Defined<P[number] | PluginsOf<S[number]>> {
	return config;
}

/**
 * Load the `seolint.config.*` file in `options.cwd` and apply
 * CLI-style overrides.
 * @example
 * let config = await resolve({ host: "https://example.com", inputs: ["public"] });
 */
export async function resolve(options: Argv = {}): Promise<Config> {
	let value = await load(absolute(options.cwd || "."));
	if (options.host) value.host = options.host;
	if (options.inputs && options.inputs.length > 0)
		value.inputs = options.inputs;
	if (options.workers !== undefined) value.workers = options.workers;

	if (value.host && !HTTP.test(value.host)) {
		throw new Error(
			'A `host` value must include "http://" or "https://" protocol',
		);
	}

	setup.setup(value);
	return value;
}
