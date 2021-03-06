type Dict = Record<string, any>;
type Promisable<T> = Promise<T> | T;

export type Rules<T extends Dict = Dict> = {
	[K in keyof T]: boolean | T[K];
};

export interface Context<T extends Dict = Rules> {
	readonly options: Pick<Config, 'host'> & Record<string, any>;

	load<K extends keyof T>(title: K): T[K] | void;
	report<K extends keyof T>(title: K, message: string): void;

	assert<K extends keyof T>(title: K, check: boolean, message: string): void;
	assert<K extends keyof T>(title: K, check: (options: Exclude<T[K],boolean>) => boolean, message: string): void;

	// TODO?: async checks
	// assert<K extends keyof T>(title: K, check: (options: Exclude<T[K],boolean>) => Promise<boolean>, message: string): Promise<void>;
	// assert<K extends keyof T>(title: K, check: boolean | ((options: Exclude<T[K],boolean>) => Promisable<boolean>), message: string): Promisable<void>;
}

export type Plugin<R extends Rules = Rules> = (context: Context<R>, document: HTMLElement) => Promisable<void>;

export interface Argv {
	cwd?: string;
	host?: string;
	input?: string[];
}

export interface Config {
	host?: string;
	inputs?: string[];
	presets?: Config[];
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

export function lint(html: string, config?: Omit<Config, 'inputs'>): Promise<Messages|void>;
export function url(href: string, config?: Omit<Config, 'inputs'>): Promise<Report>;
export function fs(path: string, config?: Omit<Config, 'inputs'>): Promise<Report>;
export function run(config?: Config, options?: Argv): Promise<Report>;
export function config(options?: Argv): Promise<Config>;

export declare class Assertion extends Error {
	rule: string;
	constructor(message: string, rule: string);
}
