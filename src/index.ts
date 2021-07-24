import { join, resolve } from 'path';
import { parse } from 'node-html-parser';
import { load } from './config';
import * as fs from './utils/fs';

import type { Argv, Config, Report, Messages } from 'seolint';

export async function lint(html: string, options?: Omit<Config, 'inputs'>) {
	let document = parse(html);
	// normalize rules shape
	let { rules, checks } = {} as any;

	let output: Messages = {};
	let key, rule, lvl, check;


	for (key of checks) {
		rule = rules[key] || [2];
		// if (rule[0] === ) {

		// }
		check = checks[key];
		await checks[key](document,)
		rule = [].concat(rules[key] || 2);
	}
}

// export async function fetch(url: string, options?: any) {
// 	//
// }

export async function config(options: Argv = {}): Promise<Config> {
	options.cwd = resolve(options.cwd || '.');

	let value = await load(options.cwd) || {};
	if (options.input) value.inputs = options.input;
	if (options.host) value.host = options.host;

	// value.output = value.output || {};

	// if (options.quiet) value.output.quiet = true;
	// if (options.loglevel) value.output.loglevel = options.loglevel;

	return value;
}

export async function file(): Promise<Messages> {
	//
}

export async function http(): Promise<Messages> {
	//
}

export async function run(config: Config, options: Argv): Promise<Report> {
	// // let config = await load(options.cwd || '.');
	// // let { rules, checks } = await config.load(options.cwd);

	// let output: Report = {};
	// let inputs = config.inputs || [];
	// let i=0, CWD=resolve(options.cwd || '.');
	// let isHTTP=0, isFILE=0, HTTP=/^https?:\/\//;

	// if (!inputs.length) {
	// 	throw new Error('Missing input(s) to analyze');
	// }

	// for (; i < inputs.length; i++) {
	// 	if (HTTP.test(inputs[i])) {
	// 		isHTTP++;
	// 	} else {
	// 		inputs[i] = resolve(CWD, inputs[i]);
	// 		isFILE++;
	// 	}

	// 	if (isFILE && isHTTP) {
	// 		throw new Error('Input array cannot contain file-system and URL targets');
	// 	}
	// }

	// if (isHTTP) {
	// 	await console.log('TODO');
	// } else {
	// 	await Promise.all(
	// 		inputs.map(path => {

	// 		})
	// 	);
	// }

	// let stats = await fs.lstat(path);
	// let single = stats.isFile();
}
