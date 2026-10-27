#!/usr/bin/env node
import { text } from "node:stream/consumers";
import { parseArgs } from "node:util";

import * as colors from "kleur/colors";

import * as seolint from "./index";
import { version } from "../package.json";

import type { Report } from "./types";

const HELP = `
  Usage
    $ seolint [inputs] [options]

  Options
    -i, --input    Accept HTML via stdin pipe
    -H, --host     Specify the target hostname
    -j, --json     Print JSON output to console
    -q, --quiet    Disable terminal reporting
    --no-color     Disable colored output
    -v, --version  Displays current version
    -h, --help     Displays this message

  Examples
    $ seolint public
    $ seolint public/index.html
    $ seolint dir1 dir2 dir3/file.html
    $ seolint https://example.com https://google.com
    $ curl -s https://example.com | seolint -i
    $ find public -type f -exec seolint {} +
`;

function bail(err: unknown): void {
	process.exitCode = 1;

	let chain: string[] = [];
	while (err instanceof Error && err.cause != null) {
		chain.push(err.message);
		err = err.cause;
	}

	if (!(err instanceof Error)) chain.push(String(err));
	else if (chain.length > 0) chain.push(err.stack || err.message);
	else chain.push(err.message);

	console.error(chain.join("\n  caused by: "));
}

try {
	var { values: flags, positionals: input } = parseArgs({
		allowPositionals: true,
		options: {
			input: { type: "boolean", short: "i" },
			host: { type: "string", short: "H" },
			json: { type: "boolean", short: "j" },
			quiet: { type: "boolean", short: "q" },
			"no-color": { type: "boolean" },
			version: { type: "boolean", short: "v" },
			help: { type: "boolean", short: "h" },
		},
	});
} catch (err) {
	bail(err);
	process.exit();
}

if (flags.help) {
	console.log(HELP);
	process.exit();
}

if (flags.version) {
	console.log(`seolint, v${version}`);
	process.exit();
}

if (flags.input && process.stdin.isTTY) {
	bail(`Must use '-i' or '--input' with stdin pipe`);
	process.exit();
}

try {
	var options = { host: flags.host, input };
	var config = await seolint.config(options);
	var report: Report = flags.input
		? await seolint
				.lint(await text(process.stdin), config)
				.then((x): Report => (x ? { stdin: x } : {}))
		: await seolint.run(config, options);
} catch (err) {
	bail(err);
	process.exit();
}

if (flags.quiet) {
	process.exit(Object.keys(report).length > 0 ? 1 : 0);
}

let remote =
	!flags.input && (config.inputs || []).every((x) => /^https?:\/\//.test(x));

if (!config.host && !remote) {
	console.warn(
		"! cannot run `link.internal` rules without a known `host` value",
	);
}

if (flags.json) {
	// TODO: remove "message" keys?
	console.log(JSON.stringify(report));
	process.exit(0);
}

if (flags["no-color"]) colors.$.enabled = false;

const cwd = process.cwd();
const SYM = colors.red("  ✘  ");
const FAIL = colors.bold(colors.bgRed(" FAIL "));

let total = 0;

for (let [item, messages] of Object.entries(report)) {
	let rows = Object.entries(messages)
		.flatMap(([rule, list]) => list.map((x) => ({ rule, ...x })))
		.sort(
			(a, b) => (a.line || 0) - (b.line || 0) || (a.col || 0) - (b.col || 0),
		);

	if (rows.length === 0) continue;
	total += rows.length;

	let locations = rows.map((x) => (x.line ? `${x.line}:${x.col}` : ""));
	let wLoc = Math.max(...locations.map((x) => x.length));
	let wMsg = Math.max(...rows.map((x) => x.message.length));

	let file = item.startsWith(cwd)
		? item.substring(cwd.length).replace(/^[\\/]+/, "")
		: item;
	let output =
		"\n" +
		FAIL +
		colors.bold(" " + colors.underline(colors.white(file))) +
		"\n";

	rows.forEach((row, i) => {
		output += "  " + colors.dim(locations[i].padStart(wLoc, " ")) + SYM;
		output += row.message.padEnd(wMsg, " ");
		output += "  " + colors.dim(row.rule) + "\n";
	});

	process.stderr.write(output);
}

if (total > 0) {
	let output = "\n" + FAIL + " Reported " + colors.red(total) + " error";
	if (total !== 1) output += "s";
	console.error(output + "!\n");
	process.exitCode = 1;
} else {
	console.log(
		"\n" + colors.bold(colors.green(" PASS ")) + " Looks great! 🎉\n",
	);
}
