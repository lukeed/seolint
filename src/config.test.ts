import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import * as config from "./config";

import type { Config, Plugin } from "./types";

const fixtures = resolve(import.meta.dir, "fixtures");
const noop: Plugin = () => {};

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
	test("should always return `Config` object", async () => {
		let output = await config.load(import.meta.dir);

		expect(output.host).toBe("");
		expect(output.inputs).toEqual([]);
		expect(output.plugins).toHaveLength(6);
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

describe("merge()", () => {
	test("should merge two `Config` objects together", () => {
		let input: Config = {
			host: "",
			inputs: [],
			presets: [],
			plugins: [],
			rules: {},
		};

		config.merge(input, {
			host: "https://x.com",
			inputs: ["foobar"],
			rules: {
				"a.b": 123,
				"a.c": 456,
			},
		});

		expect(input).toEqual({
			host: "https://x.com",
			inputs: ["foobar"],
			presets: [],
			plugins: [],
			rules: {
				"a.b": 123,
				"a.c": 456,
			},
		});
	});

	test("should concatenate `plugins` arrays", () => {
		let [p1, p2, n1, n2] = [noop, noop, noop, noop].map((fn) => fn.bind(null));
		let input: Config = { plugins: [p1, p2] };

		config.merge(input, { plugins: [n1, n2] });
		expect(input.plugins).toEqual([p1, p2, n1, n2]);
	});

	test("should override `inputs` arrays", () => {
		let input: Config = { inputs: ["foo1", "foo2"] };

		config.merge(input, { inputs: ["next1", "next2"] });
		expect(input.inputs).toEqual(["next1", "next2"]);
	});

	test("should merge `rules` objects", () => {
		let input: Config = {
			rules: { foo: 1, bar: 2 },
		};

		config.merge(input, {
			rules: { bar: 123, baz: 456 },
		});

		expect(input.rules).toEqual({ foo: 1, bar: 123, baz: 456 });
	});

	test("should merge `presets` recursively", () => {
		let [bar1, bar2, foo1, foo2, custom1, custom2] = Array.from(
			{ length: 6 },
			() => noop.bind(null),
		);

		let input: Config = {
			host: "",
			inputs: [],
			plugins: [],
			rules: {},
		};

		let bar: Config = {
			host: "https://bar.com",
			inputs: ["bar-dir"],
			plugins: [bar1, bar2],
			rules: {
				"bar.1": true,
				"bar.2": true,
			},
		};

		let foo: Config = {
			host: "https://foo.com",
			inputs: ["foo-dir"],
			plugins: [foo1, foo2],
			presets: [bar],
			rules: {
				"foo.1": true,
				"foo.2": true,
			},
		};

		config.merge(input, {
			host: "https://hello.com",
			inputs: ["public", "examples"],
			plugins: [custom1, custom2],
			presets: [foo],
			rules: {
				"foo.1": false,
				"bar.2": false,
				hello: 123,
			},
		});

		expect(input).toEqual({
			host: "https://hello.com",
			inputs: ["public", "examples"],
			plugins: [bar1, bar2, foo1, foo2, custom1, custom2],
			rules: {
				"bar.1": true,
				"bar.2": false,
				"foo.1": false,
				"foo.2": true,
				hello: 123,
			},
		});
	});
});
