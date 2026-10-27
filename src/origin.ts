import { pathToFileURL } from "node:url";

import * as merger from "./merge";

import type { Config, Plugin } from "./types";

const files = new WeakMap<Config, string>();

/**
 * Record that `config` was loaded from `file`, so workers can load its plugins.
 */
export function remember(config: Config, file: string): void {
	files.set(config, file);
}

/**
 * The config file that `config` was loaded from, if any.
 */
export function file(config: Config): string | undefined {
	return files.get(config);
}

/**
 * Import a config file and return its plugins, with those of its presets.
 * Imports are cached, so the main thread gets the same plugin objects again.
 */
export async function plugins(path: string): Promise<readonly Plugin[]> {
	let mod = await import(pathToFileURL(path).href);
	let output: Config = {};
	merger.merge(output, mod.default || mod);
	return output.plugins ?? [];
}
