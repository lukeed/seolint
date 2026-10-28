import { builtins } from "../../src/plugins/index.ts";

/** Each built-in plugin and its number of rules, largest first. */
export default builtins
	.map((x) => ({ name: x.name, count: Object.keys(x.rules).length }))
	.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
