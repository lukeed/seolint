import { dirname, join, resolve } from 'path';
import { list } from './utils/fs';

// Default plugins
import { title } from './plugins/title';
import { canonical } from './plugins/canonical';
import { description } from './plugins/description';
import { viewport } from './plugins/viewport';
import { image } from './plugins/image';
import { link } from './plugins/link';

import type { Config, Plugin } from 'seolint';

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
export function merge(base: Config, custom: Config) {
	base.host = custom.host || base.host;
	base.inputs = custom.inputs || base.inputs;
	(custom.presets || []).forEach(x => merge(base, x));
	if (custom.plugins) base.plugins!.push(...custom.plugins);
	if (custom.rules) Object.assign(base.rules!, custom.rules);
}

export async function load(root: string): Promise<Config> {
	let output: Config = {
		host: '',
		inputs: [],
		plugins: [],
		rules: {},
	};

	let file = await find(root, '.');

	if (file) {
		let config = /\.cjs$/.test(file) ? require(file) : await import(file);
		merge(output, config.default || config);
	}

	// include default plugins
	(output.plugins as Plugin<any>[]).unshift(
		title, canonical, description,
		viewport, image, link,
	);

	return output;
}
