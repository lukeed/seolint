import type { HTMLElement, Node } from "node-html-parser";

export type Dict = Record<string, unknown>;
export type Promisable<T> = Promise<T> | T;

export type Rules<T extends Dict = Dict> = {
	[K in keyof T]: boolean | T[K];
};

export type Context<T extends Dict = Rules> = {
	readonly options: Pick<Config, "host"> & Dict;

	load<K extends keyof T>(title: K): T[K] | undefined;
	report<K extends keyof T>(title: K, message: string, node?: Node): void;

	assert<K extends keyof T>(
		title: K,
		check: boolean,
		message: string,
		node?: Node,
	): void;
	assert<K extends keyof T>(
		title: K,
		check: (options: Exclude<T[K], boolean>) => boolean,
		message: string,
		node?: Node,
	): void;

	// TODO?: async checks
	// assert<K extends keyof T>(title: K, check: (options: Exclude<T[K],boolean>) => Promise<boolean>, message: string): Promise<void>;
	// assert<K extends keyof T>(title: K, check: boolean | ((options: Exclude<T[K],boolean>) => Promisable<boolean>), message: string): Promisable<void>;
};

export type Plugin<R extends Rules = Rules> = (
	context: Context<R>,
	document: HTMLElement,
) => Promisable<void>;

export type Argv = {
	cwd?: string;
	host?: string;
	input?: string[];
};

export type Config = {
	host?: string;
	inputs?: string[];
	presets?: Config[];
	plugins?: Plugin<never>[];
	rules?: Rules;
};

export type Message = {
	message: string;
	line?: number;
	col?: number;
};

export type Messages = {
	[rule: string]: Message[];
};

export type Report = {
	[input: string]: Messages;
};
