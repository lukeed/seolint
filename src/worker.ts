import { parentPort, workerData } from "node:worker_threads";

import { inspect } from "./inspect";
import * as origin from "./origin";
import { pack } from "./pool";
import * as setup from "./setup";
import { read } from "./target";

import type { Init, Reply, Task } from "./pool";

const port = parentPort!;
const init: Init = workerData;
const plugins = init.file ? await origin.plugins(init.file) : [];
const state = setup.setup({ ...init.config, plugins });

/**
 * The error for data that `postMessage` cannot clone, naming its plugin.
 */
function unsendable(data: [string, unknown][]): Error {
	for (let [name, value] of data) {
		try {
			structuredClone(value);
		} catch {
			return new Error(
				`Plugin "${name}" returned data that cannot be sent between threads`,
			);
		}
	}
	return new Error("A page result cannot be sent between threads");
}

port.on("message", async ({ id, target }: Task) => {
	let reply: Reply;
	try {
		let html = await read(target);
		let result = await inspect(html, state, target.host, target.url);
		reply = { id, messages: result.messages, data: [...result.data] };
	} catch (err) {
		port.postMessage({ id, error: pack(err) } satisfies Reply);
		return;
	}

	try {
		port.postMessage(reply);
	} catch {
		port.postMessage({
			id,
			error: pack(unsendable(reply.data)),
		} satisfies Reply);
	}
});
