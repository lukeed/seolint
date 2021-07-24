import { dirname, join, resolve } from 'path';
import { list } from './utils/fs';

import type { Config } from 'seolint';

const priority = [
	'seolint.config.mjs',
	'seolint.config.cjs',
	'seolint.config.js',
];

/**
 * Traverse upwards until find a config file
 * @NOTE Does not leave `root` directory
 * @see (modified) lukeed/escalade
 */
export async function find(root: string, start: string): Promise<string|void> {
	let i=0, dir = resolve(root, start);
	let files = new Set(await list(dir));

	for (; i < priority.length; i++) {
		if (files.has(priority[i])) {
			return join(dir, priority[i]);
		}
	}

	dir = dirname(dir);
	if (dir !== root) {
		return find(root, dir);
	}
}

/**
 * Merge config objects
 * Overrides default values
 * Priority: rules > plugins
 * @NOTE Mutates `base` object!
 */
export function merge(base: Config, custom: Config) {

}

export async function load(root: string): Promise<Config> {
	let output: Config = {};

	let file = await find(root, '.');
	if (!file) return output;

	let config = /\.cjs$/.test(file) ? require(file) : await import(file);
	output = config.default || config;

	return merge(defaults, output);
}
