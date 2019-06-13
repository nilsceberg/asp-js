import { Stream, Bucket } from "./Stream";
//import { FileInputStream } from "./FileInputStream";

import * as path from "path";

export abstract class InputStream implements Stream {
	constructor(filename: string, content: string) {
		this.content = content;
		this.position = 1;
		this.line = 1;
		this.filename = filename;
	}

	next(): Bucket {
		if (this.include) {
			const next = this.include.next();
			if (next.content) {
				return next;
			}
			this.include = null;
		}

		if (this.content === "") {
			return {
				content: null,
				filename: this.filename,
				line: this.line,
				position: this.position,
			};
		}

		if (this.content[0] === "<") {
			const includeMatch = this.content.match(/^<!--\s*#include\s+(file|virtual)\s*=\s*"([^"]+)"\s*-->/);
			if (includeMatch) {
				if (includeMatch[1] === "virtual") {
					this.error("virtual includes are not yet supported");
				}

				const includedFilename = path.join(path.dirname(this.filename), includeMatch[2]);
				this.include = this.openInclude(includedFilename);
				this.content = this.content.slice(includeMatch[0].length); // skip include statement itself
				return this.next();
			}
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
		if (this.include) {
			return this.include.peek();
		}
		
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

	protected abstract openInclude(filename: string): InputStream;

	private process(chr: string) {
		return chr;
	}

	private error(message: string) {
		throw new Error(`input error in ${this.filename} at line ${this.line}, column ${this.position}: ${message}`);
	}

	private line: number;
	private position: number;
	private content: string;
	private filename: string;
	private include: InputStream;
}

