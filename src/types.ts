import type { Document, Node } from "@lukeed/html";

export type Dict = Record<string, unknown>;
export type Promisable<T> = Promise<T> | T;

/**
 * Rule names, each mapped to `true`, or to the rule's default options.
 */
export type Rules = Record<string, boolean | Dict>;

/**
 * A rule setting in a config: `true` or `false` to turn the rule on or off,
 * or options that override the rule's defaults.
 */
export type Setting = boolean | Dict;

export type Context<T extends Rules = Rules> = {
	/** Site settings from the config. */
	readonly options: { host?: string };

	/** The rule's options, `true` for a rule without options, or `undefined` when the rule is off. */
	load<K extends keyof T>(rule: K): T[K] | undefined;
	/** Report a failure, unless the rule is off. */
	report<K extends keyof T>(rule: K, message: string, node?: Node): void;

	assert<K extends keyof T>(
		rule: K,
		check: boolean,
		message: string,
		node?: Node,
	): void;
	assert<K extends keyof T>(
		rule: K,
		check: (options: Exclude<T[K], boolean>) => boolean,
		message: string,
		node?: Node,
	): void;

	// TODO?: async checks
	// assert<K extends keyof T>(title: K, check: (options: Exclude<T[K],boolean>) => Promise<boolean>, message: string): Promise<void>;
	// assert<K extends keyof T>(title: K, check: boolean | ((options: Exclude<T[K],boolean>) => Promisable<boolean>), message: string): Promisable<void>;
};

export type Plugin<T extends Rules = Rules> = {
	/** A plugin replaces a built-in plugin with the same name. */
	name: string;
	rules: T;
	run(context: Context<T>, document: Document): Promisable<void>;
};

export type Argv = {
	cwd?: string;
	host?: string;
	inputs?: string[];
};

export type Config = {
	host?: string;
	inputs?: string[];
	presets?: Config[];
	plugins?: readonly Plugin[];
	rules?: Record<string, Setting>;
};

export type Message = {
	rule: string;
	message: string;
	line?: number;
	col?: number;
};

export type Report = {
	[input: string]: Message[];
};
