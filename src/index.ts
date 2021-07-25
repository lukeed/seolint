import { request } from 'https';
import { globalAgent } from 'http';
import { parse } from 'node-html-parser';
import { join, relative, resolve } from 'path';
import { load } from './config';
import * as fs from './utils/fs';

import type { Argv, Context, Config } from 'seolint';
import type { Report, Messages } from 'seolint';

export async function config(options: Argv = {}): Promise<Config> {
	options.cwd = resolve(options.cwd || '.');

	let value = await load(options.cwd) || {};
	if (options.host) value.host = options.host;
	if (options.input) value.inputs = options.input;

	return value;
}

export async function lint(html: string, config: Omit<Config, 'inputs'>): Promise<Messages> {
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

export async function file(path: string, config: Omit<Config, 'inputs'>): Promise<Report> {
	let output: Report = {};

	let stats = await fs.lstat(path);

	if (stats.isFile()) {
		if (!/\.html?$/.test(path)) return output;
		let data = await fs.read(path, 'utf8');

		return lint(data, config).then(msgs => {
			output[path] = msgs;
			return output;
		});
	}

	let arr = await fs.list(path);

	await Promise.all(
		arr.map(x => {
			let nxt = join(path, x);
			return file(nxt, config).then(rep => {
				Object.assign(output, rep);
			});
		})
	);

	return output;
}

export function http(url: string, config: Omit<Config, 'inputs'>): Promise<Report> {
	return new Promise((res, rej) => {
		let content = '', output: Report = {};
		let agent = /^http:\/\//.test(url) && globalAgent;

		let req = request(url, { agent }, r => {
			let type = r.headers['content-type'] || '';
			console.log('~> type:', type, r.statusCode);

			if (!type.includes('text/html')) {
				return rej('Invalid "Content-Type" header');
			}

			r.setEncoding('utf8');
			r.on('data', d => { content += d });
			r.on('end', async () => {
				let msgs = await lint(content, config).catch(rej);
				if (msgs) output[url] = msgs;
				return res(output);
			});
		});

		req.on('error', rej);
	});
}

export async function run(config: Config, options: Argv): Promise<Report> {
	let output: Report = {};
	let isHTTP=0, HTTP=/^https?:\/\//;
	let cwd = options.cwd = resolve(options.cwd || '.');
	let i=0, inputs = ([] as string[]).concat(config.inputs || []);
	if (inputs.length === i) throw new Error('Missing inputs to analyze');

	for (; i < inputs.length; i++) {
		if (HTTP.test(inputs[i])) isHTTP++;
		else inputs[i] = join(cwd, inputs[i]);
	}

	if (isHTTP && isHTTP !== inputs.length) {
		throw new Error('Inputs cannot contain both file-system and URL targets');
	}

	let action = isHTTP ? http : file;

	await Promise.all(
		inputs.map(input => {
			return action(input, config).then(report => {
				if (isHTTP) output = report;
				else for (let key in report) {
					output[relative(cwd, key)] = report[key];
				}
			}).catch(err => {
				console.error('ERROR', input, err.stack);
			});
		})
	);

	return output;
}
