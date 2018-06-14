import { Stream, Bucket } from "./Stream";

import { readFileSync } from "fs";

export class InputStream implements Stream {
	constructor(filename: string) {
		this.content = readFileSync(filename, "utf-8");
		this.position = 1;
		this.line = 1;
	}

	next(): Bucket {
		if (this.content === "") {
			return null;
		}

		let chr = this.content[0];
		this.content = this.content.slice(1);

		let bucket = <Bucket>{
			content: chr,
			line: this.line,
			position: this.position++,
		};

		if (chr === "\n") {
			this.position = 1;
			this.line++;
		}

		return bucket;
	}

	peek(): Bucket {
		if (this.content === "") {
			return null;
		}

		return {
			content: this.content[0],
			line: this.line,
			position: this.position,
		};
	}

	private line: number;
	private position: number;
	private content: string;
}

