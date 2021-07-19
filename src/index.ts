import { parse } from 'node-html-parser';
import * as config from './config';

import type { Config, Messages } from 'seolint';

export async function lint(html: string, options?: Omit<Config, 'inputs'>) {
	let document = parse(html);
	let checks = { ... };
	// normalize rules shape
	let rules = { ... };

	let output: Messages = {};
	let key, rule, lvl;

	for (key of checks) {
		rule = [].concat(rules[key] || 2);
	}
}

export async function fetch(url: string, options?: any) {
	//
}

export async function load(path: string, options?: any) {
	//
}
