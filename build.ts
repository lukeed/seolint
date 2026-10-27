import { rm } from "node:fs/promises";
import { $ } from "bun";

const OUTDIR = "dist";

await rm(OUTDIR, {
	recursive: true,
	force: true,
});

let result = await Bun.build({
	entrypoints: [
		"src/index.ts",
		"src/config.ts",
		"src/presets.ts",
		"src/worker.ts",
		"src/bin.ts",
	],
	root: "src",
	outdir: OUTDIR,
	target: "node",
	packages: "external",
	splitting: true,
	minify: true,
});

if (!result.success) {
	for (let log of result.logs) console.error(log);
	process.exit(1);
}

for (let output of result.outputs) {
	let size = (output.size / 1024).toFixed(2).padStart(6);
	console.log(`${size} kB  ${output.path.slice(process.cwd().length + 1)}`);
}

await $`bun x tsc -p tsconfig.build.json`;
