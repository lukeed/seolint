import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import * as conf from "./config";
import * as seolint from "./index";

import type { Plugin } from "./types";

const site = join(resolve(import.meta.dir, "fixtures"), "site");
const HOST = "https://example.com";

const THREAD_PLUGIN = `{
	name: "thread",
	rules: { "thread.page": true, "thread.site": true },
	run(context) {
		let { isMainThread } = process.getBuiltinModule("node:worker_threads");
		context.report("thread.page", isMainThread ? "main" : "worker");
		return { worker: !isMainThread };
	},
	finish(site, pages) {
		let workers = pages.filter((x) => x.data.worker).length;
		site.report("thread.site", workers + " of " + pages.length + " in workers", pages[0].input);
	},
}`;

describe("workers", () => {
	let tmp: string;

	beforeAll(async () => {
		tmp = await realpath(await mkdtemp(join(tmpdir(), "seolint-")));
		await mkdir(join(tmp, "public/a"), { recursive: true });
		for (let name of ["index.html", "a/index.html", "b.html", "c.html"]) {
			await writeFile(join(tmp, "public", name), "<html></html>");
		}
	});

	afterAll(async () => {
		await rm(tmp, { recursive: true, force: true });
	});

	async function project(config: string): Promise<string> {
		let dir = await mkdtemp(join(tmp, "project-"));
		await writeFile(join(dir, "seolint.config.mjs"), config);
		return dir;
	}

	test("should match the report of one thread", async () => {
		let one = await seolint.fs(site, { host: HOST, workers: 1 });
		let many = await seolint.fs(site, { host: HOST, workers: 2 });
		expect(many).toEqual(one);
		expect(Object.keys(many)).toEqual([join(site, "sub/bad.html")]);
	});

	test("should load plugins from the config file in each worker", async () => {
		let cwd = await project(
			`export default { inputs: [${JSON.stringify(join(tmp, "public"))}], workers: 2, rules: { "*": false, "thread.*": true }, plugins: [${THREAD_PLUGIN}] }`,
		);
		let config = await conf.resolve({ cwd });
		let report = await seolint.run(config, { cwd });
		let messages = Object.values(report).flat();

		expect(
			messages.filter((x) => x.rule === "thread.page").map((x) => x.message),
		).toEqual(["worker", "worker", "worker", "worker"]);
		expect(messages.find((x) => x.rule === "thread.site")?.message).toBe(
			"4 of 4 in workers",
		);
	});

	test("should stay on one thread for inline plugins", async () => {
		let plugin: Plugin = {
			name: "inline",
			rules: { "inline.rule": true },
			run(context) {
				context.report("inline.rule", "ran");
			},
		};
		let report = await seolint.fs(join(tmp, "public"), {
			plugins: [plugin],
			rules: { "*": false, "inline.rule": true },
		});
		expect(Object.values(report).flat()).toHaveLength(4);
	});

	test("should reject inline plugins with more than one worker", async () => {
		let plugin: Plugin = { name: "inline", rules: {}, run() {} };
		await expect(
			seolint.fs(join(tmp, "public"), { plugins: [plugin], workers: 2 }),
		).rejects.toThrow(
			'Plugin "inline" must come from a config file to run in workers; set `workers: 1` to lint on one thread',
		);
	});

	test("should reject an invalid `workers` value", async () => {
		await expect(seolint.fs(site, { workers: 1.5 })).rejects.toThrow(
			"Invalid `workers` value: expected a positive integer",
		);
		await expect(seolint.fs(site, { workers: 0 })).rejects.toThrow(
			"Invalid `workers` value: expected a positive integer",
		);
	});

	test("should reject when a plugin throws in a worker", async () => {
		let cwd = await project(
			`export default { inputs: [${JSON.stringify(join(tmp, "public"))}], workers: 2, plugins: [{ name: "boom", rules: {}, run() { throw new TypeError("nope") } }] }`,
		);
		let config = await conf.resolve({ cwd });
		let error = await seolint.run(config, { cwd }).catch((x) => x);

		expect(error.message).toStartWith("Failed to lint");
		expect(error.cause.message).toBe('Plugin "boom" failed');
		expect(error.cause.cause.message).toBe("nope");
	});

	test("should reject data that cannot be sent between threads", async () => {
		let cwd = await project(
			`export default { inputs: [${JSON.stringify(join(tmp, "public"))}], workers: 2, plugins: [{ name: "odd", rules: {}, run() { return { fn() {} } } }] }`,
		);
		let config = await conf.resolve({ cwd });
		let error = await seolint.run(config, { cwd }).catch((x) => x);

		expect(error.message).toStartWith("Failed to lint");
		expect(error.cause.message).toBe(
			'Plugin "odd" returned data that cannot be sent between threads',
		);
	});
});
