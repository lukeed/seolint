import * as fs from 'fs';
import { promisify } from 'util';

export const exists = /*#__PURE__*/ fs.existsSync;
export const list = /*#__PURE__*/ promisify(fs.readdir);
export const write = /*#__PURE__*/ promisify(fs.writeFile);
export const read = /*#__PURE__*/ promisify(fs.readFile);
export const lstat = /*#__PURE__*/ promisify(fs.lstat);
