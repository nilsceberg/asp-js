import { Stream, Bucket } from "./Stream";

import { readFileSync } from "fs";

export class InputStream implements Stream {
	constructor(filename: string) {
		this.content = readFileSync(filename, "utf-8");
		this.position = 1;
		this.line = 1;
		this.filename = filename;
	}

	next(): Bucket {
		if (this.content === "") {
			return {
				content: null,
				filename: this.filename,
				line: this.line,
				position: this.position,
			};
		}

		let chr = this.content[0];
		this.content = this.content.slice(1);

		let bucket = <Bucket>{
			content: this.process(chr),
			line: this.line,
			position: this.position++,
			filename: this.filename,
		};

		if (chr === "\n") {
			this.position = 1;
			this.line++;
		}

		return bucket;
	}

	peek(): Bucket {
		if (this.content === "") {
			return {
				content: null,
				filename: this.filename,
				line: this.line,
				position: this.position,
			};
		}

		return {
			content: this.process(this.content[0]),
			line: this.line,
			position: this.position,
			filename: this.filename,
		};
	}

	private process(chr: string) {
		return chr;
	}

	private line: number;
	private position: number;
	private content: string;
	private filename: string;
}

