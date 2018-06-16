import { Stream, Bucket } from "./Stream";
import { InputStream } from "./InputStream";

function error(bucket: Bucket, message: string) {
	throw new Error(`runtime error in ${bucket.filename} at line ${bucket.line}, column ${bucket.position}: ${message}`);
}

export namespace tokens {
	export abstract class Token {
		constructor(value: any) {
			this.value = value;
		}
		value: any;

		toString(): string {
			return `'${this.value}'`;
		}
	};

	export class Identifier extends Token {
		constructor(name: string) {
			super(name);
		}
	}

	export class String extends Token {
		constructor(value: string) {
			super(value);
		}

		toString(): string {
			return `string literal "${this.value}"`;
		}
	}

	export class Integer extends Token {
		constructor(value: number) {
			super(value);
		}

		toString(): string {
			return `integer literal "${this.value}"`;
		}
	}

	export class Inline extends Token {
		constructor(value: string) {
			super(value);
		}
	}

	export class Punctuation extends Token {
		constructor(value: string) {
			super(value);
		}
	}
}

export class TokenStream implements Stream {
	constructor(input: InputStream, asp: boolean = false) {
		this.input = input;
		this.peekValue = null;
		this.asp = asp;
		this.inline = asp;
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

		if (this.inline) {
			this.inline = false;
			return this.nextInline(this.input.peek());
		}

		let bucket = this.skipWhitespace();
		let token;

		if (this.isIdentifierStart(bucket)) {
			token = this.nextIdentifier(bucket);
		}
		else if (this.isInteger(bucket)) {
			token = this.nextInteger(bucket);
		}
		else if (bucket.content === "\"") {
			token = this.nextString(bucket);
		}
		else if (bucket.content === "'") {
			this.skipComment();
			token = this.next();
		}
		else if (this.isNewLine(bucket)) {
			bucket.content = new tokens.Punctuation(":");
			token = bucket;
		}
		else if (bucket.content === "%") {
			const next = this.input.peek().content;
			if (next === ">") {
				this.input.next();
				bucket.content = this.nextInline(bucket).content;
			}
			else {
				bucket.content = new tokens.Punctuation(bucket.content);
			}
			token = bucket;
		}
		else {
			bucket.content = new tokens.Punctuation(bucket.content);
			token = bucket;
		}

		if (token.content.value === null) {
			token.content = null;
		}

		return token;
	}

	private nextIdentifier(start: Bucket): Bucket {
		let bucket;
		while ((bucket = this.input.peek()).content !== null
			&& this.isIdentifier(bucket)) {
			this.input.next();
			start.content += bucket.content;
		}
		start.content = start.content.toLowerCase();
		start.content = new tokens.Identifier(start.content);
		return start;
	}

	private nextInteger(start: Bucket): Bucket {
		let bucket;
		while ((bucket = this.input.peek()).content !== null
			&& this.isInteger(bucket)) {
			this.input.next();
			start.content += bucket.content;
		}
		start.content = new tokens.Integer(Number(start.content));
		return start;
	}

	private nextString(start: Bucket): Bucket {
		start.content = "";

		while (true) {
			const bucket = this.input.next();
			if (bucket.content === null) {
				error(bucket, "unexpected end of file in string");
			}
			else if (bucket.content === "\"") {
				if (this.input.peek().content !== "\"") {
					break;
				}
				else {
					this.input.next();
				}
			}

			start.content += bucket.content;
		}

		start.content = new tokens.String(start.content);
		return start;
	}

	private nextInline(start: Bucket): Bucket {
		start.content = "";
		let bucket = start;

		while (true) {
			if (bucket.content === null) {
				break;
			}
			else if (bucket.content === "<") {
				if (this.input.peek().content === "%") {
					this.input.next();
					break;
				}
			}

			start.content += bucket.content;

			bucket = this.input.next();
		}

		start.content = new tokens.Inline(start.content);
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
	private asp: boolean;
	private inline: boolean;
}

