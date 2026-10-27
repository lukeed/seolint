import { stat } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";

import * as origin from "./origin";

import type { Result } from "./inspect";
import type { Target } from "./target";
import type { Config, Message } from "./types";

/** How workers get their config: its data, and the file to load plugins from. */
export type Init = { file: string | undefined; config: Config };
export type Task = { id: number; target: Target };
export type Reply =
	| { id: number; messages: Message[]; data: [string, unknown][] }
	| { id: number; error: Packed };

/** An error as plain data, with its `cause` chain, to send between threads. */
export type Packed = {
	name: string;
	message: string;
	stack: string | undefined;
	cause?: Packed;
};

/** How many threads lint the pages, and where workers load plugins from. */
export type Plan = { size: number; file: string | undefined };

/** About the bytes of HTML that one thread lints in a worker's start-up time. */
const BYTES_PER_WORKER = 8e6;

/** Pages each worker holds at once, so it can read one while it lints another. */
const IN_FLIGHT = 4;

const SCRIPT = new URL(
	import.meta.url.endsWith(".ts") ? "./worker.ts" : "./worker.js",
	import.meta.url,
);

export function pack(error: unknown): Packed {
	if (!(error instanceof Error)) {
		return { name: "Error", message: String(error), stack: undefined };
	}
	let output: Packed = {
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
	if (error.cause !== undefined) output.cause = pack(error.cause);
	return output;
}

function unpack(packed: Packed): Error {
	let options = packed.cause ? { cause: unpack(packed.cause) } : undefined;
	let error = new Error(packed.message, options);
	error.name = packed.name;
	error.stack = packed.stack;
	return error;
}

/**
 * The default number of threads: one per {@link BYTES_PER_WORKER} of HTML, up
 * to half the logical CPUs, since more contend for memory and cache. URLs
 * stay on one thread, because their size is unknown until they are fetched.
 */
async function auto(targets: Target[]): Promise<number> {
	let cores = Math.floor(availableParallelism() / 2);
	if (cores < 2 || targets.some((x) => x.remote)) return 1;
	let sizes = await Promise.all(targets.map((x) => stat(x.input)));
	let bytes = sizes.reduce((sum, x) => sum + x.size, 0);
	return Math.min(cores, Math.floor(bytes / BYTES_PER_WORKER));
}

/**
 * Decide how many threads lint `targets`. Custom plugins can run in workers
 * only when they are the same objects that their config file exports.
 * @throws {Error} for an invalid `workers` value, or for plugins that cannot
 * run in workers when `workers` asks for more than one.
 */
export async function plan(config: Config, targets: Target[]): Promise<Plan> {
	let wanted = config.workers;
	if (wanted !== undefined && !(Number.isInteger(wanted) && wanted > 0)) {
		throw new Error("Invalid `workers` value: expected a positive integer");
	}

	let size = Math.min(targets.length, wanted ?? (await auto(targets)));
	if (size <= 1) return { size: 1, file: undefined };

	let custom = config.plugins ?? [];
	if (custom.length === 0) return { size, file: undefined };

	let file = origin.file(config);
	let loaded = file ? await origin.plugins(file) : [];
	let odd = custom.find((x, i) => x !== loaded[i]);
	if (!odd && loaded.length === custom.length) return { size, file };
	if (wanted === undefined) return { size: 1, file: undefined };

	let name = (odd ?? custom[0]).name;
	throw new Error(
		`Plugin "${name}" must come from a config file to run in workers; set \`workers: 1\` to lint on one thread`,
	);
}

/**
 * Lint `targets` in `plan.size` workers. Results keep the order of `targets`.
 * Rejects with the first failure, and stops every worker.
 */
export function run(
	targets: Target[],
	config: Config,
	plan: Plan,
): Promise<Result[]> {
	let init: Init = {
		file: plan.file,
		config: {
			host: config.host,
			inputs: config.inputs,
			ignore: config.ignore,
			rules: config.rules,
		},
	};

	return new Promise((resolve, reject) => {
		let results: Result[] = new Array(targets.length);
		let next = 0;
		let done = 0;
		let settled = false;

		let workers = Array.from(
			{ length: plan.size },
			() => new Worker(SCRIPT, { workerData: init }),
		);

		let stop = (error?: Error): void => {
			if (settled) return;
			settled = true;
			for (let worker of workers) worker.terminate();
			if (error) reject(error);
			else resolve(results);
		};

		let send = (worker: Worker): void => {
			if (next >= targets.length) return;
			let id = next++;
			worker.postMessage({ id, target: targets[id] } satisfies Task);
		};

		for (let worker of workers) {
			worker.on("message", (reply: Reply) => {
				if ("error" in reply) {
					let input = targets[reply.id].input;
					let cause = unpack(reply.error);
					return stop(new Error(`Failed to lint "${input}"`, { cause }));
				}
				results[reply.id] = {
					messages: reply.messages,
					data: new Map(reply.data),
				};
				if (++done === targets.length) return stop();
				send(worker);
			});
			worker.on("error", (cause) => {
				stop(new Error("A worker failed", { cause }));
			});
			worker.on("exit", (code) => {
				stop(new Error(`A worker exited early with code ${code}`));
			});
			for (let i = 0; i < IN_FLIGHT; i++) send(worker);
		}
	});
}
