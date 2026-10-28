import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../..");
const EXAMPLE = join(ROOT, "example");
const BIN = join(ROOT, "dist/bin.js");

if (!existsSync(BIN))
	throw new Error('Missing dist/bin.js; run "bun run build" first');
if (!existsSync(join(EXAMPLE, "public"))) {
	throw new Error('Missing example/public; run "bun run example build" first');
}

let proc = spawnSync(process.execPath, [BIN, "public"], {
	cwd: EXAMPLE,
	encoding: "utf8",
	env: { ...process.env, NO_COLOR: "1" },
});
if (proc.status !== 1)
	throw new Error(`Expected the example to fail:\n${proc.stderr}`);

/** The real seolint output for the example site, for the landing page demo. */
export default {
	command: "npx seolint public",
	lines: proc.stderr.replace(/\n+$/, "").split("\n"),
};
