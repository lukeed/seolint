import type { Meta, Severity } from "../types";

const DOCS = "https://seolint.io/docs/rules/";

/**
 * The link to a built-in rule's page on seolint.io.
 * @example
 * docs("title.exists"); //=> "https://seolint.io/docs/rules/title.exists/"
 */
export function docs(rule: string): string {
	return `${DOCS}${rule}/`;
}

/**
 * Build the `meta` of a built-in plugin: each rule maps to its description,
 * to `[severity, description]` when it does not default to `"error"`, or to
 * `[severity, description, "off"]` when it is off by default.
 * @example
 * meta({ "title.exists": "A page has a <title>.", "og.image": ["warn", "A page has an og:image."] });
 */
export function meta(
	rules: Record<
		string,
		string | [Severity, string] | [Severity, string, "off"]
	>,
): Record<string, Meta> {
	let output: Record<string, Meta> = {};
	for (let [rule, value] of Object.entries(rules)) {
		if (typeof value === "string") {
			output[rule] = { description: value, docs: docs(rule) };
			continue;
		}
		let [severity, description, off] = value;
		output[rule] = off
			? { description, severity, off: true, docs: docs(rule) }
			: { description, severity, docs: docs(rule) };
	}
	return output;
}
