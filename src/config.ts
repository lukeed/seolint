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

export async function load(file: string): Promise<Config> {
	return /\.cjs$/.test(file) ? require(file) : import(file);
}

/**
 * Merge config objects
 * Overrides default values
 * Priority: rules > plugins
 * @NOTE Mutates `base` object!
 */
export function merge(base: Config, custom: Config) {

}
