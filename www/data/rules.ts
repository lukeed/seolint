import { builtins } from "../../src/plugins/index.ts";

import type { Meta } from "../../src/types.ts";

export type Rule = {
	name: string;
	plugin: string;
	severity: "error" | "warn";
	/** Whether the rule is off unless a config turns it on. */
	off: boolean;
	options: Record<string, unknown> | undefined;
	description: string;
};

/** Each built-in plugin with its rules, in the order that seolint runs them. */
export default builtins.map((plugin) => {
	let meta: Record<string, Meta | undefined> = plugin.meta ?? {};
	let rules: Rule[] = Object.entries(plugin.rules).map(([name, value]) => ({
		name,
		plugin: plugin.name,
		severity: meta[name]?.severity ?? "error",
		off: value === false,
		options: typeof value === "object" ? value : undefined,
		description: meta[name]?.description ?? "",
	}));
	return { name: plugin.name, rules };
});
