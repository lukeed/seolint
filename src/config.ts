import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import * as plugins from "./plugins";

import type { Config } from "./types";

const priority = [
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
	let dir = resolve(root, start);
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

/**
 * Merge config objects
 * Overrides default values
 * Priority: rules > plugins
 * @NOTE Mutates `base` object!
 */
export function merge(base: Config, custom: Config): void {
	(custom.presets || []).forEach((x) => merge(base, x));
	if (custom.plugins) base.plugins!.push(...custom.plugins);
	if (custom.rules) Object.assign(base.rules!, custom.rules);
	base.inputs = custom.inputs || base.inputs;
	base.host = custom.host || base.host;
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
		let config = await import(pathToFileURL(file).href);
		merge(output, config.default || config);
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
