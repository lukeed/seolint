import { describe, expect, test } from "bun:test";

import * as merger from "./merge";

import type { Config, Plugin } from "./types";

const noop: Plugin = () => {};

describe("merge()", () => {
	test("should merge two `Config` objects together", () => {
		let input: Config = {
			host: "",
			inputs: [],
			presets: [],
			plugins: [],
			rules: {},
		};

		merger.merge(input, {
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

		merger.merge(input, { plugins: [n1, n2] });
		expect(input.plugins).toEqual([p1, p2, n1, n2]);
	});

	test("should override `inputs` arrays", () => {
		let input: Config = { inputs: ["foo1", "foo2"] };

		merger.merge(input, { inputs: ["next1", "next2"] });
		expect(input.inputs).toEqual(["next1", "next2"]);
	});

	test("should merge `rules` objects", () => {
		let input: Config = {
			rules: { foo: 1, bar: 2 },
		};

		merger.merge(input, {
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

		merger.merge(input, {
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
