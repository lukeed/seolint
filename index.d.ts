type Dict = Record<string, any>;
type Promisable<T> = Promise<T> | T;

export type Rules<T extends Dict = Dict> = {
	[K in keyof T]: boolean | T[K];
};

export interface Context<T extends Dict = Rules> {
	load<K extends keyof T>(title: K): T[K] | void;
	report<K extends keyof T>(title: K, message: string): void;

	assert<K extends keyof T>(title: K, check: boolean, message: string): void;
	assert<K extends keyof T>(title: K, check: (options: Exclude<T[K],boolean>) => boolean, message: string): void;

	// TODO?: async checks
	// assert<K extends keyof T>(title: K, check: (options: Exclude<T[K],boolean>) => Promise<boolean>, message: string): Promise<void>;
	// assert<K extends keyof T>(title: K, check: boolean | ((options: Exclude<T[K],boolean>) => Promisable<boolean>), message: string): Promisable<void>;
}

export type Plugin<R extends Rules = Rules> = (context: Context<R>, document: HTMLElement) => Promisable<void>;

// export function file(): Promise<Messages>;
// export function http(): Promise<Messages>;

export interface Argv {
	cwd?: string;
	host?: string;
	input?: string[];
}

export interface Config {
	host?: string;
	inputs?: string[];
	plugins?: Plugin[];
	rules?: Rules;
}

export interface Message {
	message: string;
	line?: number;
	col?: number;
}

export type Messages = {
	[rule: string]: Message;
}

export type Report = {
	[input: string]: Messages;
}

export function config(options?: Argv): Promise<Config>;
export function lint(html: string, config: Config): Promise<Messages>;
export function run(config: Config, options: Argv): Promise<Report>;

export declare class Assertion extends Error {
	rule: string;
	constructor(message: string, rule: string);
}
