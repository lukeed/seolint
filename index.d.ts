export type Toggle =
	| 'off' | 'warn' | 'error'
	| 0 | 1 | 2;

type Dict = Record<string, any>;
export type Rule<T extends Dict = Dict> = Toggle | [Toggle, T];
export type Rules<T extends Dict = Dict> = {
	[K in keyof T]: Rule<T[K]>;
};

export type Severity = 'warn' | 'error';

// export type Check

export interface Message {
	level: Severity;
	message: string;
	line?: number;
	col?: number;
}

export type Messages = {
	[rule: string]: Message;
}

export type Plugin<
	O extends Dict = Dict,
	T extends Dict = Dict,
> = (options?: O) => {
	rules: Rules<T>,
	// checks: Check<T>,
};

export interface Config {
	inputs: string | string[];
	hostname?: string;
	output?: {
		quiet?: boolean;
		colors?: boolean;
		loglevel?: Severity;
	};
	// presets?: Rule[];
	plugins?: Plugin[];
	rules?: Rules;
}
