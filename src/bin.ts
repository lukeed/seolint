#!/usr/bin/env node
import { isAbsolute, relative } from "node:path";
import { text } from "node:stream/consumers";
import { parseArgs, styleText } from "node:util";

import * as conf from "./config";
import * as seolint from "./index";
import * as setup from "./setup";
import { version } from "../package.json";

import type { Message, Report } from "./types";

type Format = Parameters<typeof styleText>[0];

const HELP = `
  Usage
    $ seolint [inputs] [options]

  Options
    -H, --host     The site URL, such as https://example.com
    -f, --format   The output format: pretty, json, or ci (default pretty)
    -j, --json     The same as --format json
    -q, --quiet    Print nothing; only set the exit code
    -i, --input    Read HTML from stdin
    --workers      How many threads lint pages (default: auto)
    --rules        List every rule, with its setting and description
    --no-color     Print without colors
    -v, --version  Print the version
    -h, --help     Print this help

  Examples
    $ seolint public --host https://example.com
    $ seolint public/index.html
    $ seolint public docs/index.html
    $ seolint https://example.com/
    $ seolint --rules
    $ curl -s https://example.com | seolint -i

  Docs: https://seolint.io/docs/cli/
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
			format: { type: "string", short: "f" },
			quiet: { type: "boolean", short: "q" },
			rules: { type: "boolean" },
			"no-color": { type: "boolean" },
			workers: { type: "string" },
			version: { type: "boolean", short: "v" },
			help: { type: "boolean", short: "h" },
		},
	});
} catch (err) {
	bail(err);
	process.exit();
}

const FORMATS = ["pretty", "json", "ci"];
const format = flags.json ? "json" : (flags.format ?? "pretty");

if (!FORMATS.includes(format)) {
	bail(`Unknown format "${format}"; expected one of: ${FORMATS.join(", ")}`);
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

if (flags.rules) {
	try {
		var listing = setup.setup(await conf.resolve({ host: flags.host }));
	} catch (err) {
		bail(err);
		process.exit();
	}

	let rows = [...listing.rules].map(([rule, info]) => ({
		rule,
		plugin: info.plugin,
		severity: info.state ? info.state.severity : "off",
		options:
			info.state && typeof info.state.options === "object"
				? info.state.options
				: undefined,
		description: info.meta?.description ?? "",
		docs: info.meta?.docs,
	}));

	if (format === "json") {
		console.log(JSON.stringify(rows));
		process.exit();
	}

	let wRule = Math.max(...rows.map((x) => x.rule.length));
	let wLevel = Math.max(...rows.map((x) => x.severity.length));
	for (let row of rows) {
		let line = row.rule.padEnd(wRule) + "  " + row.severity.padEnd(wLevel);
		line += "  " + row.description;
		if (row.options) line += "  " + JSON.stringify(row.options);
		console.log("  " + line);
	}
	process.exit();
}

try {
	var options = {
		host: flags.host,
		inputs: input,
		workers: flags.workers === undefined ? undefined : Number(flags.workers),
	};
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

let failed = Object.values(report).some((list) =>
	list.some((x) => x.severity === "error"),
);

if (flags.quiet) {
	process.exit(failed ? 1 : 0);
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

if (format === "json") {
	console.log(JSON.stringify(Object.fromEntries(entries)));
	process.exit(failed ? 1 : 0);
}

if (format === "ci") {
	let escape = (input: string) =>
		input.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
	let property = (input: string) =>
		escape(input).replace(/:/g, "%3A").replace(/,/g, "%2C");

	let errors = 0;
	let warnings = 0;
	for (let [file, list] of entries) {
		let remote = /^https?:\/\//.test(file);
		for (let row of list) {
			let kind = row.severity === "error" ? "error" : "warning";
			if (kind === "error") errors++;
			else warnings++;

			let props = remote ? [] : [`file=${property(file)}`];
			if (row.line) props.push(`line=${row.line}`, `col=${row.col}`);
			props.push(`title=${property(row.rule)}`);

			let text = remote ? `${file}: ${row.message}` : row.message;
			console.log(`::${kind} ${props.join(",")}::${escape(text)}`);
		}
	}

	console.log(
		`seolint: ${count(errors, "error")} and ${count(warnings, "warning")}`,
	);
	process.exit(failed ? 1 : 0);
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

const SYMBOL = {
	error: style(ERR, "red", "  ✘  "),
	warn: style(ERR, "yellow", "  ⚠  "),
};
const FAIL = style(ERR, "bold", style(ERR, "bgRed", " FAIL "));
const WARN = style(ERR, "bold", style(ERR, "bgYellow", " WARN "));

function count(total: number, noun: string): string {
	return `${total} ${noun}${total === 1 ? "" : "s"}`;
}

let rows = entries.flatMap(([, list]) => list);
let errors = rows.filter((x) => x.severity === "error").length;
let warnings = rows.length - errors;
let wLoc = Math.max(0, ...rows.map((x) => location(x).length));
let wMsg = Math.max(0, ...rows.map((x) => x.message.length));

for (let [file, list] of entries) {
	if (list.length === 0) continue;

	let label = list.some((x) => x.severity === "error") ? FAIL : WARN;
	let output =
		"\n" +
		label +
		style(
			ERR,
			"bold",
			" " + style(ERR, "underline", style(ERR, "white", file)),
		) +
		"\n";

	for (let row of list) {
		output += "  " + style(ERR, "dim", location(row).padStart(wLoc, " "));
		output += SYMBOL[row.severity] + row.message.padEnd(wMsg, " ");
		output += "  " + style(ERR, "dim", row.rule) + "\n";
	}

	process.stderr.write(output);
}

if (errors > 0) {
	let summary = style(ERR, "red", count(errors, "error"));
	if (warnings > 0)
		summary += " and " + style(ERR, "yellow", count(warnings, "warning"));
	console.error("\n" + FAIL + " Reported " + summary + "!\n");
	process.exitCode = 1;
} else if (warnings > 0) {
	let summary = style(ERR, "yellow", count(warnings, "warning"));
	console.error("\n" + WARN + " Reported " + summary + "\n");
} else {
	console.log(
		"\n" +
			style(OUT, "bold", style(OUT, "green", " PASS ")) +
			" Looks great! 🎉\n",
	);
}
