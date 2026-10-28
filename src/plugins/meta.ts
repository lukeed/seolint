import type { Meta, Severity } from "../types";

const DOCS = "https://seolint.io/docs/rules/";

/**
 * The link to a built-in rule's section of the rules reference on seolint.io.
 * @example
 * docs("title.exists"); //=> "https://seolint.io/docs/rules/#titleexists"
 */
export function docs(rule: string): string {
	return `${DOCS}#${rule.replace(/[^\w-]/g, "").toLowerCase()}`;
}

/**
 * Build the `meta` of a built-in plugin: each rule maps to its description,
 * or to `[severity, description]` when it does not default to `"error"`.
 * @example
 * meta({ "title.exists": "A page has a <title>.", "og.image": ["warn", "A page has an og:image."] });
 */
export function meta(
	rules: Record<string, string | [Severity, string]>,
): Record<string, Meta> {
	let output: Record<string, Meta> = {};
	for (let [rule, value] of Object.entries(rules)) {
		let [severity, description] =
			typeof value === "string" ? [undefined, value] : value;
		output[rule] = severity
			? { description, severity, docs: docs(rule) }
			: { description, docs: docs(rule) };
	}
	return output;
}
