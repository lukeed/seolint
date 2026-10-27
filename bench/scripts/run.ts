import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { join } from "node:path";

import { bench, do_not_optimize, run } from "mitata";
import * as seolint from "seolint";

import * as corpus from "./corpus.ts";
import { COPIES, HOST, SITE } from "./build.ts";

export type Result = {
	runtime: string;
	cpu: string;
	date: string;
	pages: number;
	bytes: number;
	/** Milliseconds to lint every corpus page once, in one process. */
	lint: { avg: number; p75: number; p99: number };
	/** A fresh process that lints the whole site on one thread, as the median of samples. */
	site: Site;
	/** The same, with the default number of workers. */
	workers: Site;
};

type Site = { pages: number; ms: number; rss: number };

const FLAG = "--site";
const SAMPLES = 5;

/**
 * Lint the site once, then print the time and the peak resident memory.
 */
async function sample(workers: number | undefined): Promise<void> {
	let start = performance.now();
	let report = await seolint.fs(SITE, { host: HOST, workers });
	let ms = performance.now() - start;
	let rss = process.resourceUsage().maxRSS * 1024;
	do_not_optimize(report);
	console.log(JSON.stringify({ ms, rss }));
}

function median(values: number[]): number {
	let sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Lint the site in {@link SAMPLES} fresh processes, so each sample starts cold.
 */
function site(pages: number, workers: number | undefined): Site {
	let args = [import.meta.filename, FLAG, String(workers ?? "")];
	let runs = Array.from({ length: SAMPLES }, () => {
		let proc = spawnSync(process.execPath, args, { encoding: "utf8" });
		if (proc.status !== 0) throw new Error(proc.stderr);
		return JSON.parse(proc.stdout) as {
			ms: number;
			rss: number;
		};
	});
	return {
		pages,
		ms: median(runs.map((x) => x.ms)),
		rss: median(runs.map((x) => x.rss)),
	};
}

if (process.argv[2] === FLAG) {
	await sample(process.argv[3] ? Number(process.argv[3]) : undefined);
	process.exit(0);
}

const pages = await corpus.load();
const bytes = pages.reduce((sum, x) => sum + Buffer.byteLength(x.html), 0);
const runtime = globalThis.Bun
	? `Bun ${Bun.version}`
	: `Node ${process.version}`;

console.log(
	`${runtime}, ${pages.length} pages, ${(bytes / 1e6).toFixed(2)} MB\n`,
);

bench("lint", async () => {
	for (let page of pages) {
		do_not_optimize(await seolint.lint(page.html, { host: HOST }));
	}
}).gc("inner");

let output = await run({ colors: false });
let stats = [...output.benchmarks][0].runs[0].stats;
if (!stats) throw new Error("The lint benchmark did not run");

console.log("\nLinting the site in fresh processes...");

let result: Result = {
	runtime,
	cpu: cpus()[0].model,
	date: new Date().toISOString().slice(0, 10),
	pages: pages.length,
	bytes,
	lint: {
		avg: stats.avg / 1e6,
		p75: stats.p75 / 1e6,
		p99: stats.p99 / 1e6,
	},
	site: site(pages.length * COPIES, 1),
	workers: site(pages.length * COPIES, undefined),
};

for (let key of ["site", "workers"] as const) {
	let { ms, rss } = result[key];
	console.log(`${key}: ${ms.toFixed(0)}ms, ${(rss / 1e6).toFixed(0)}MB`);
}

let dir = join(import.meta.dirname, "..", "results");
await mkdir(dir, { recursive: true });
await writeFile(
	join(dir, globalThis.Bun ? "bun.json" : "node.json"),
	JSON.stringify(result, null, 2) + "\n",
);
