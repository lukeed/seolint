import { readdir } from "node:fs/promises";
import { dirname, join, resolve as absolute } from "node:path";
import { pathToFileURL } from "node:url";

import * as plugins from "./plugins";
import * as merger from "./merge";

import type { Argv, Config } from "./types";

export type { Argv, Config } from "./types";

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
	}

	// include default plugins
	output.plugins!.unshift(
		plugins.title,
		plugins.canonical,
		plugins.description,
		plugins.viewport,
		plugins.image,
		plugins.link,
	);

	return output;
}

/**
 * Type a config object. Use it as the default export of `seolint.config.ts`.
 * @example
 * export default define({ host: "https://example.com", inputs: ["public"] });
 */
export function define(config: Config): Config {
	return config;
}

/**
 * Load the nearest `seolint.config.*` file from `options.cwd` and apply
 * CLI-style overrides.
 * @example
 * let config = await resolve({ host: "https://example.com", input: ["public"] });
 */
export async function resolve(options: Argv = {}): Promise<Config> {
	let value = await load(absolute(options.cwd || "."));
	if (options.host) value.host = options.host;
	if (options.input && options.input.length > 0) value.inputs = options.input;

	if (value.host && !HTTP.test(value.host)) {
		throw new Error(
			'A `host` value must include "http://" or "https://" protocol',
		);
	}

	return value;
}
