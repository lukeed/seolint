import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import * as config from "./config";

const fixtures = resolve(import.meta.dir, "fixtures");

describe("find()", () => {
	test("should return `undefined` if file not found", async () => {
		let output = await config.find(import.meta.dir, import.meta.dir);
		expect(output).toBeUndefined();
	});

	test("should return `string` if file found", async () => {
		let output = await config.find(import.meta.dir, fixtures);
		expect(output).toBe(resolve(fixtures, "seolint.config.mjs"));
	});
});

describe("load()", () => {
	test("should load a TypeScript config file first", async () => {
		let dir = resolve(fixtures, "typescript");
		expect(await config.find(dir, dir)).toBe(resolve(dir, "seolint.config.ts"));

		let output = await config.load(dir);
		expect(output.host).toBe("https://typescript.dev");
		expect(output.rules).toEqual({ "title.content.length": { max: 70 } });
	});

	test("should always return `Config` object", async () => {
		let output = await config.load(import.meta.dir);

		expect(output.host).toBe("");
		expect(output.inputs).toEqual([]);
		expect(output.plugins).toEqual([]);
		expect(output.rules).toEqual({});
	});

	test("should merge `Config` from loaded config file", async () => {
		let output = await config.load(fixtures);

		expect(output.host).toBe("https://hello.com");
		expect(output.inputs).toEqual(["https://hello.com/world/"]);
		expect(output.rules).toEqual({
			"canonical.href.match": false,
		});
	});
});

describe("resolve()", () => {
	test("should resolve with `Config` defaults", async () => {
		let output = await config.resolve();

		expect(output.host).toBe("");
		expect(output.inputs).toEqual([]);
		expect(output.plugins).toEqual([]);
		expect(output.rules).toEqual({});
	});

	test("should accept `input` option", async () => {
		let output = await config.resolve({ inputs: ["foo", "bar"] });
		expect(output.inputs).toEqual(["foo", "bar"]);
	});

	test("should accept `host` option :: valid", async () => {
		let output = await config.resolve({ host: "https://foobar.com" });
		expect(output.host).toBe("https://foobar.com");
	});

	test("should accept `host` option :: invalid", async () => {
		await expect(config.resolve({ host: "foobar.com" })).rejects.toThrow(
			'A `host` value must include "http://" or "https://" protocol',
		);
	});

	test("should accept custom `cwd` option", async () => {
		let output = await config.resolve({ cwd: fixtures });

		expect(output.host).toBe("https://hello.com");
		expect(output.inputs).toEqual(["https://hello.com/world/"]);
		expect(output.rules).toEqual({ "canonical.href.match": false });
	});

	test("should always prefer `input` and `host` over config file", async () => {
		let output = await config.resolve({
			cwd: fixtures,
			host: "https://x.com",
			inputs: ["public"],
		});

		expect(output.host).toBe("https://x.com");
		expect(output.inputs).toEqual(["public"]);
		expect(output.rules).toEqual({ "canonical.href.match": false });
	});

	test("should keep config file `inputs` when `input` is empty", async () => {
		let output = await config.resolve({ cwd: fixtures, inputs: [] });
		expect(output.inputs).toEqual(["https://hello.com/world/"]);
	});

	test("should apply `workers`", async () => {
		let output = await config.resolve({ cwd: fixtures, workers: 3 });
		expect(output.workers).toBe(3);
	});

	test("should reject an invalid `workers` value", async () => {
		for (let workers of [0, 1.5, Number.NaN]) {
			await expect(config.resolve({ cwd: fixtures, workers })).rejects.toThrow(
				"Invalid `workers` value: expected a positive integer",
			);
		}
	});
});

describe("define()", () => {
	test("should return the config unchanged", () => {
		let input = { host: "https://x.com", rules: { "title.exists": false } };
		expect(config.define(input)).toBe(input);
	});

	test("should type rule names and options", () => {
		let custom = config.plugin({
			name: "custom",
			rules: { "custom.rule": { max: 1 } },
			run() {},
		});

		config.define({
			plugins: [custom],
			rules: {
				"title.content.length": { max: 70 },
				"custom.rule": { max: 2 },
				"link.*": false,
				// @ts-expect-error unknown rule
				"title.exist": false,
			},
		});

		config.define({
			// @ts-expect-error wrong option type
			rules: { "title.content.length": { max: "70" } },
		});

		config.define({
			// @ts-expect-error a rule without options
			rules: { "title.exists": { max: 1 } },
		});
	});

	test("should type category keys", () => {
		config.define({
			rules: { "#style": false, "#social": "error", "#security": true },
		});

		config.define({
			// @ts-expect-error unknown category
			rules: { "#styel": false },
		});

		config.define({
			// @ts-expect-error a category takes no options
			rules: { "#style": { max: 1 } },
		});
	});

	test("should type the rules of plugins from presets", () => {
		let custom = config.plugin({
			name: "custom",
			rules: { "custom.rule": { max: 1 } },
			run() {},
		});
		let base = config.define({ plugins: [custom] });
		let nested = config.define({ presets: [base] });

		config.define({
			presets: [nested],
			rules: { "custom.rule": { max: 2 } },
		});

		config.define({
			presets: [nested],
			// @ts-expect-error wrong option type
			rules: { "custom.rule": { max: "2" } },
		});
	});
});
