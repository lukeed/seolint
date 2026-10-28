import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../..");
const EXAMPLE = join(ROOT, "example");
const BIN = join(ROOT, "dist/bin.js");

/** How many pages the phone terminal replays. */
const PHONE_PAGES = 2;

if (!existsSync(BIN))
	throw new Error('Missing dist/bin.js; run "bun run build" first');
if (!existsSync(join(EXAMPLE, "public"))) {
	throw new Error('Missing example/public; run "bun run example build" first');
}

let proc = spawnSync(process.execPath, [BIN, "public"], {
	cwd: EXAMPLE,
	encoding: "utf8",
	env: { ...process.env, NO_COLOR: "1" },
});
if (proc.status !== 1)
	throw new Error(`Expected the example to fail:\n${proc.stderr}`);

let lines = proc.stderr.replace(/\n+$/, "").split("\n");

/** Each page of the output: its header line, its message lines, and its counts. */
type Page = { path: string; lines: string[]; errors: number; warnings: number };

let pages: Page[] = [];
for (let line of lines) {
	let header = line.match(/^ (?:FAIL|WARN)  (\S+)$/);
	if (header)
		pages.push({ path: header[1], lines: [line], errors: 0, warnings: 0 });
	else if (/[✘⚠]/u.test(line) && pages.length > 0) {
		let page = pages[pages.length - 1];
		page.lines.push(line);
		if (line.includes("✘")) page.errors++;
		else page.warnings++;
	}
}

function count(total: number, noun: string): string {
	return `${total} ${noun}${total === 1 ? "" : "s"}`;
}

/**
 * The CLI's summary line for `list`, in the same words as the pretty format.
 */
function summary(list: Page[]): string {
	let errors = list.reduce((sum, x) => sum + x.errors, 0);
	let warnings = list.reduce((sum, x) => sum + x.warnings, 0);
	if (errors === 0) return ` WARN  Reported ${count(warnings, "warning")}`;
	let text = count(errors, "error");
	if (warnings > 0) text += ` and ${count(warnings, "warning")}`;
	return ` FAIL  Reported ${text}!`;
}

if (summary(pages) !== lines[lines.length - 1]) {
	throw new Error(
		`The summary no longer matches the CLI: ${lines[lines.length - 1]}`,
	);
}

let first = pages.slice(0, PHONE_PAGES);

/** The real seolint output for the example site, for the landing page demo. */
export default {
	command: "npx seolint public",
	lines,
	/** The first pages of the output, with a summary that counts only them. */
	phone: ["", ...first.flatMap((x) => [...x.lines, ""]), summary(first)],
	pages: Object.fromEntries(
		pages.map((x) => [x.path, { errors: x.errors, warnings: x.warnings }]),
	),
};
