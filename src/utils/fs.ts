export { existsSync as exists } from 'fs';

export {
	readdir as list,
	writeFile as write,
	readFile as read,
	lstat as lstat,
} from 'fs/promises';
