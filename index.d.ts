type Dict = Record<string, any>;
type Promisable<T> = Promise<T> | T;

export type Rules<T extends Dict = Dict> = {
	[K in keyof T]: boolean | T[K];
};

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

export type Plugin<
	O extends Dict = Dict,
	T extends Dict = Dict,
> = (options?: O) => {
	rules: Rules<T>,
	// checks: Check<T>,
};

export interface Config {
	host?: string;
	inputs?: string[];
	// output?: {
	// 	quiet?: boolean;
	// 	colors?: boolean;
	// 	loglevel?: Severity;
	// };
	// presets?: Rule[];
	plugins?: Plugin[];
	rules?: Rules;
}

export interface Argv {
	cwd?: string;
	host?: string;
	input?: string[];
}

export interface Context<T extends Dict = Dict> {
	load<K extends keyof T>(title: K): T[K] | void;
	report<K extends keyof T>(title: K, message: string): void;

	assert<K extends keyof T>(
		title: K,
		check: (options: T[K]) => boolean,
		message: string
	): void;

	assert<K extends keyof T>(
		title: K,
		check: (options: T[K]) => Promise<boolean>,
		message: string
	): Promise<void>;
}

// export function file(): Promise<Messages>;
// export function http(): Promise<Messages>;

export function config(options?: Argv): Promise<Config>;
export function lint(html: string, config: Config): Promise<Messages>;
export function run(config: Config, options: Argv): Promise<Report>;
