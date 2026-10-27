import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import * as plugins from "./index";
import * as about from "./meta";

import type { Meta } from "../types";

const DOCS = await Bun.file(
	join(import.meta.dir, "../../docs/rules.md"),
).text();

/**
 * The text of the docs section for `rule`, up to the next heading.
 */
function section(rule: string): string | undefined {
	let heading = `### \`${rule}\`\n`;
	let start = DOCS.indexOf(heading);
	if (start === -1) return;
	let stops = [
		DOCS.indexOf("\n## ", start + heading.length),
		DOCS.indexOf("\n### ", start + heading.length),
	].filter((x) => x !== -1);
	return DOCS.slice(start, stops.length > 0 ? Math.min(...stops) : undefined);
}

describe("docs/rules.md", () => {
	for (let plugin of plugins.builtins) {
		let meta: Record<string, Meta | undefined> = plugin.meta ?? {};

		for (let [rule, value] of Object.entries(plugin.rules)) {
			test(rule, () => {
				let info = meta[rule];
				expect(info?.description).toBeString();
				expect(info?.docs).toBe(about.docs(rule));

				let text = section(rule);
				expect(text).toBeString();

				let severity = info?.severity ?? "error";
				let expected =
					typeof value === "object"
						? `**Default:** \`${severity}\`, with options \`${JSON.stringify(value)}\``
						: `**Default:** \`${severity}\``;
				expect(text).toContain(`${expected}\n`);

				let anchor = about.docs(rule).split("#")[1];
				expect(DOCS).toContain(`[\`${rule}\`](#${anchor})`);
			});
		}
	}

	test("documents no other rules", () => {
		let documented = [...DOCS.matchAll(/^### `([\w.]+)`$/gm)].map((x) => x[1]);
		let declared = plugins.builtins.flatMap((x) => Object.keys(x.rules));
		expect(documented.sort()).toEqual(declared.sort());
	});
});
