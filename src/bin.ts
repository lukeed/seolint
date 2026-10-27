#!/usr/bin/env node
import { isAbsolute, relative } from "node:path";
import { text } from "node:stream/consumers";
import { parseArgs, styleText } from "node:util";

import * as conf from "./config";
import * as seolint from "./index";
import { version } from "../package.json";

import type { Message, Report } from "./types";

type Format = Parameters<typeof styleText>[0];

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
	var options = { host: flags.host, inputs: input };
	var config = await conf.resolve(options);
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

const cwd = process.cwd();

let entries = Object.entries(report).map(
	([item, list]): [string, Message[]] => [
		isAbsolute(item) ? relative(cwd, item) : item,
		[...list].sort(
			(a, b) => (a.line || 0) - (b.line || 0) || (a.col || 0) - (b.col || 0),
		),
	],
);

if (flags.json) {
	// TODO: remove "message" keys?
	console.log(JSON.stringify(Object.fromEntries(entries)));
	process.exit(0);
}

/**
 * Style `input` for `stream`. styleText checks the stream and the
 * NO_COLOR, NODE_DISABLE_COLORS, and FORCE_COLOR variables itself.
 */
function style(
	stream: NodeJS.WriteStream,
	format: Format,
	input: string,
): string {
	return flags["no-color"] ? input : styleText(format, input, { stream });
}

function location(message: Message): string {
	return message.line ? `${message.line}:${message.col}` : "";
}

const ERR = process.stderr;
const OUT = process.stdout;

const SYM = style(ERR, "red", "  ✘  ");
const FAIL = style(ERR, "bold", style(ERR, "bgRed", " FAIL "));

let rows = entries.flatMap(([, list]) => list);
let total = rows.length;
let wLoc = Math.max(0, ...rows.map((x) => location(x).length));
let wMsg = Math.max(0, ...rows.map((x) => x.message.length));

for (let [file, list] of entries) {
	if (list.length === 0) continue;

	let output =
		"\n" +
		FAIL +
		style(
			ERR,
			"bold",
			" " + style(ERR, "underline", style(ERR, "white", file)),
		) +
		"\n";

	for (let row of list) {
		output += "  " + style(ERR, "dim", location(row).padStart(wLoc, " ")) + SYM;
		output += row.message.padEnd(wMsg, " ");
		output += "  " + style(ERR, "dim", row.rule) + "\n";
	}

	process.stderr.write(output);
}

if (total > 0) {
	let output =
		"\n" + FAIL + " Reported " + style(ERR, "red", String(total)) + " error";
	if (total !== 1) output += "s";
	console.error(output + "!\n");
	process.exitCode = 1;
} else {
	console.log(
		"\n" +
			style(OUT, "bold", style(OUT, "green", " PASS ")) +
			" Looks great! 🎉\n",
	);
}
