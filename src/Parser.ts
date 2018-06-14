import { Bucket } from "./Stream";
import { TokenStream } from "./TokenStream";

export namespace ast {
	export class Block {
		constructor(statements: Statement[]) {
			this.statements = statements;
		}

		statements: Statement[];
	};

	export class Statement {
	};

	export class Function {
		constructor(name: string, block: Block) {
			this.name = name;
			this.block = block;
		}

		name: string;
		block: Block;
	};

	export class Variable {
		constructor(name: string) {
			this.name = name;
		}

		name: string;
	};
}

export class Parser {
	constructor(tokens: TokenStream) {
		this.tokens = tokens;
	}

	parse(): ast.Block {
		return this.block();
	}

	private block(): ast.Block {
		let block = new ast.Block([]);

		let token: Bucket;
		while ((token = this.tokens.peek()) !== null) {
			console.log(token);
			if (token.content === "function") {
				block.statements.push(this.function());
			}
			else {
				this.tokens.next();
			}
		}

		return block;
	}

	private function(): ast.Function {
		this.tokens.next(); // consume keyword

		if (this.tokens.peek() === null) {
			//this.error("unexpected end of file");
			throw new Error("unexpected end of file");
		}

		return new ast.Function(
			this.tokens.next().content,
			this.block());

		this.expect("end");
		this.expect("function");
	}

	private expect(expected: string) {
		const actual = this.tokens.next();
		if (actual.content !== expected) {
			this.error(actual, `expected '${expected}', got '$`);
		}
	}

	private error(bucket: Bucket, message: string) {
		throw new Error(`${bucket.filename} line ${bucket.line} column ${bucket.position}: ${message}`);
	}

	private tokens: TokenStream;
}

