export { existsSync as exists } from 'fs';

export {
	readdir as list,
	writeFile as write,
	lstat as lstat,
} from 'fs/promises';
