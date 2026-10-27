import { parse } from "@lukeed/html";

import { detach } from "./detach";

import type { Document, Node } from "@lukeed/html";
import type { Setup } from "./setup";
import type { Context, Dict, Message, Position } from "./types";

/** The messages of one page, and what each plugin's `run` returned. */
export type Result = {
	messages: Message[];
	data: Map<string, unknown>;
};

/**
 * Build a {@link Message}, or `undefined` when the rule is off.
 * @throws {Error} for a rule that no plugin declares.
 */
export function message(
	state: Setup,
	rule: string,
	text: string,
	position?: Position,
): Message | undefined {
	let info = state.rules.get(rule);
	if (!info) throw new Error(`Rule "${rule}" is not declared by any plugin`);
	if (info.state === false) return;

	let output: Message = {
		rule,
		severity: info.state.severity,
		message: detach(text),
	};
	if (position) {
		output.line = position.line;
		output.col = position.column;
	}
	if (info.meta?.docs) output.docs = info.meta.docs;
	return output;
}

export function options(state: Setup, rule: string): true | Dict | undefined {
	let info = state.rules.get(rule);
	if (!info) throw new Error(`Rule "${rule}" is not declared by any plugin`);
	return info.state === false ? undefined : info.state.options;
}

/**
 * Run every plugin on one page.
 */
export async function inspect(
	html: string,
	state: Setup,
	host: string | undefined,
	url: string | undefined,
): Promise<Result> {
	let document: Document = parse(html);
	let messages: Message[] = [];
	let data = new Map<string, unknown>();

	let context: Context = {
		options: { host },
		url,
		load: (rule) => options(state, rule),
		report(rule, text, node) {
			let position = node ? document.position(node.start) : undefined;
			let found = message(state, rule, text, position);
			if (found) messages.push(found);
		},
		assert(
			rule: string,
			check: boolean | ((options: Dict) => boolean),
			text: string,
			node?: Node,
		) {
			let found = options(state, rule);
			if (found === undefined) return;
			let passed =
				typeof check === "function"
					? check(typeof found === "object" ? found : {})
					: check;
			passed || context.report(rule, text, node);
		},
	};

	for (let plugin of state.plugins) {
		try {
			let value = await plugin.run(context, document);
			if (value !== undefined) data.set(plugin.name, value);
		} catch (err) {
			throw new Error(`Plugin "${plugin.name}" failed`, { cause: err });
		}
	}

	return { messages, data };
}
