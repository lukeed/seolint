import { expect, test } from "bun:test";
import { heapStats } from "bun:jsc";

import { detach } from "./detach";

test("should keep the text", () => {
	expect(detach("Hello, world")).toBe("Hello, world");
	expect(detach("\ud800 lone")).toBe("\ud800 lone");
});

test("should not keep the source string alive", () => {
	let kept: string[] = [];
	for (let i = 0; i < 20; i++) {
		let source = "abcdefghij".repeat(1e6) + i;
		kept.push(detach(source.slice(1000, 1050)));
	}
	Bun.gc(true);
	expect(heapStats().extraMemorySize).toBeLessThan(50e6);
	expect(kept).toHaveLength(20);
});
