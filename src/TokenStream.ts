import { Stream, Bucket } from "./Stream";
import { InputStream } from "./InputStream";

export class TokenStream implements Stream {
	constructor(input: InputStream) {
		this.input = input;
		this.peekValue = null;
	}

	peek(): Bucket {
		if (this.peekValue !== null) {
			return this.peekValue;
		}
		else {
			const bucket = this.next();
			this.peekValue = bucket;
			return bucket;
		}
	}

	next(): Bucket {
		if (this.peekValue !== null) {
			let bucket = this.peekValue;
			this.peekValue = null;
			return bucket;
		}

		let bucket = this.skipWhitespace();

		if (this.isIdentifierStart(bucket)) {
			return this.nextIdentifier(bucket);
		}
		else if (this.isInteger(bucket)) {
			return this.nextInteger(bucket);
		}
		else if (bucket.content === "'") {
			this.skipComment();
			return this.next();
		}
		else if (this.isNewLine(bucket)) {
			bucket.content = ":";
			return bucket;
		}
		else {
			return bucket;
		}
	}

	private nextIdentifier(start: Bucket): Bucket {
		let bucket;
		while ((bucket = this.input.peek()).content !== null
			&& this.isIdentifier(bucket)) {
			this.input.next();
			start.content += bucket.content;
		}
		start.content = start.content.toLowerCase();
		return start;
	}

	private nextInteger(start: Bucket): Bucket {
		let bucket;
		while ((bucket = this.input.peek()).content !== null
			&& this.isInteger(bucket)) {
			this.input.next();
			start.content += bucket.content;
		}
		return start;
	}

	private skipWhitespace(): Bucket {
		let bucket;
		while ((bucket = this.input.next()).content !== null) {
			if (!this.isWhitespace(bucket)) {
				break;
			}
		}

		return bucket;
	}

	private skipComment(): void {
		while (this.input.peek().content !== "\n") {
			this.input.next();
		}
	}

	private isWhitespace(bucket: Bucket): boolean {
		return (bucket.content === " "
			|| bucket.content === "\t");
	}

	private isIdentifierStart(bucket: Bucket): boolean {
		return bucket.content !== null && /[a-zA-Z_]/.test(bucket.content);
	}

	private isIdentifier(bucket: Bucket): boolean {
		return bucket.content !== null && /[a-zA-Z0-9_]/.test(bucket.content);
	}

	private isInteger(bucket: Bucket): boolean {
		return bucket.content !== null && /[0-9]/.test(bucket.content);
	}

	private isNewLine(bucket: Bucket): boolean {
		return bucket.content === "\n" || bucket.content === ":";
	}

	private input: InputStream;
	private peekValue: Bucket;
}

