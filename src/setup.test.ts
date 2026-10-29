import { describe, expect, test } from "bun:test";

import * as setup from "./setup";

import type { Config } from "./types";

/** The severity of each rule that a config turns on. */
function enabled(config: Config): Record<string, string> {
	let output: Record<string, string> = {};
	for (let [rule, info] of setup.setup(config).rules) {
		if (info.state) output[rule] = info.state.severity;
	}
	return output;
}

describe("categories", () => {
	test("set every rule of a category", () => {
		let rules = enabled({ rules: { "#style": false } });
		expect(rules["link.internal.lowercase"]).toBeUndefined();
		expect(rules["canonical.href.lowercase"]).toBeUndefined();
		expect(rules["title.exists"]).toBe("error");
	});

	test("turn on the rules that are off by default", () => {
		let rules = enabled({ rules: { "#security": "warn" } });
		expect(rules["link.blank.noopener"]).toBe("warn");
		expect(rules["link.blank.noreferrer"]).toBe("warn");
		expect(rules["mixed.content"]).toBe("warn");
	});

	test("apply after patterns, and before exact names", () => {
		let only = enabled({ rules: { "*": false, "#social": true } });
		expect(Object.keys(only).sort()).toEqual([
			"og.description",
			"og.image",
			"og.image.secure",
			"og.title",
			"og.url",
			"twitter.card",
		]);

		let rules = enabled({
			rules: {
				"link.*": "error",
				"#style": false,
				"link.internal.lowercase": "warn",
			},
		});
		expect(rules["link.internal.lowercase"]).toBe("warn");
		expect(rules["link.internal.pretty"]).toBeUndefined();
		expect(rules["link.text.vague"]).toBe("error");
	});

	test("reject an unknown category", () => {
		expect(() => setup.setup({ rules: { "#styel": false } })).toThrow(
			'Unknown rule in config: "#styel"',
		);
		expect(() => setup.setup({ rules: { "#constructor": false } })).toThrow(
			'Unknown rule in config: "#constructor"',
		);
	});

	test("match the category of a custom rule", () => {
		let custom = {
			name: "brand",
			rules: { "brand.title": true },
			meta: {
				"brand.title": { description: "x", category: "search" as const },
			},
			run() {},
		};
		let rules = enabled({ plugins: [custom], rules: { "#search": "warn" } });
		expect(rules["brand.title"]).toBe("warn");
	});
});
