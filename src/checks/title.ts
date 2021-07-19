import type { Rule, Plugin } from 'seolint';

type Dict = Record<string, any>;

declare namespace Rules {
	interface Title {
		'title.exists': void;
		'title.single': void;
		'title.content': void;
		'title.length': {
			min: number;
			ideal?: number;
			max: number;
		};
	}
}

type Severity = 'error' | 'warn';
type Check<O extends Dict = Dict> = (options?: O) => boolean;

interface RuleContext<K extends keyof O, O extends Dict> {
	name: K;
	level: Severity;
	options: O;
}

interface Context<T extends Dict = Rules.Title> {
	load<K extends keyof T>(title: K): RuleContext<K, T[K]> | void;
	report<K extends keyof T>(rule: RuleContext<K, T[K]>, message: string, type?: Severity): void;
	assert<K extends keyof T>(title: K, check: Check<T[K]>, message: string): void;
}

export function title(context: Context, document: HTMLElement) {
	let [elem, ...rest] = document.querySelectorAll('title');

	context.assert(
		'title.exists',
		() => elem != null,
		'A title tag must exist'
	);

	context.assert(
		'title.single',
		() => rest.length > 0,
		'Must have only one title tag'
	);

	// NOTE: has "warn" condition
	let rule = context.load('title.length');

	if (rule) {
		let { options } = rule;
		let length = elem.innerText.length;

		if (length < options.min) context.report(rule, `title has less than ${options.min} characters`);
		else if (length > options.max) context.report(rule, `title has more than ${options.max} characters`);

		if (options.ideal && length > options.ideal) {
			context.report(rule, `title has more than ${options.ideal} characters`);
		}

		if (elem.innerText !== elem.innerHTML) {

		}
	}
}
