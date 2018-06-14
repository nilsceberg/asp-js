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
		constructor(name: string, args: string[], block: Block) {
			this.name = name;
			this.args = args;
			this.block = block;
		}

		name: string;
		args: string[];
		block: Block;
	};

	export class Dim {
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
		while ((token = this.tokens.peek()).content !== null) {
			console.log(token);
			if (token.content === "function") {
				block.statements.push(this.function());
			}
			else if (token.content === "end") {
				break;
			}
			else {
				this.tokens.next();
			}
		}

		return block;
	}

	private function(): ast.Function {
		this.tokens.next(); // consume keyword

		const name = this.require().content;

		this.expect("(");
		const args = this.argList();
		this.expect(")");

		const f = new ast.Function(name, args, this.block());

		this.expect("end");
		this.expect("function");

		return f;
	}

	private argList(): string[] {
		let variables = [];
		while (this.tokens.peek().content !== ")") {
			variables.push(this.require().content);

			if (this.tokens.peek().content === ")") {
				break;
			}
			else {
				this.expect(",");
			}
		}
		return variables;
	}

	private require(): Bucket {
		const token = this.tokens.next();
		if (token.content === null) {
			this.error(token, "unexpected end of file");
		}

		return token;
	}

	private expect(expected: string) {
		const actual = this.require();
		if (actual.content !== expected) {
			this.error(actual, `expected '${expected}', got '${actual.content}'`);
		}
	}

	private error(bucket: Bucket, message: string) {
		throw new Error(`${bucket.filename} line ${bucket.line} column ${bucket.position}: ${message}`);
	}

	private tokens: TokenStream;
}

