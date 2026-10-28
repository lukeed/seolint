import bun from "../../bench/results/bun.json";
import node from "../../bench/results/node.json";

/** A runtime label without the "v" that Node adds, such as "Node 26.12.1". */
function runtime(label: string): string {
	return label.replace(" v", " ");
}

/** Seconds, with one decimal, for the landing page. */
function seconds(ms: number): string {
	return (ms / 1000).toFixed(1) + "s";
}

export default {
	pages: bun.workers.pages,
	megabytes: Math.round((bun.bytes * bun.workers.pages) / bun.pages / 1e6),
	bun: { runtime: runtime(bun.runtime), site: seconds(bun.workers.ms) },
	node: { runtime: runtime(node.runtime), site: seconds(node.workers.ms) },
	cpu: bun.cpu,
};
