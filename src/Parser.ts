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

	export class Function extends Statement {
		constructor(name: string, args: string[], block: Block) {
			super();
			this.name = name;
			this.args = args;
			this.block = block;
		}

		name: string;
		args: string[];
		block: Block;
	};

	export class Dim extends Statement {
		constructor(name: string) {
			super();
			this.name = name;
		}

		name: string;
	};

	export class Assignment extends Statement {
		constructor(variable: string, expr: Expression) {
			super();
			this.variable = variable;
			this.expr = expr;
		}

		variable: string;
		expr: Expression;
	};

	export class Expression {
	};

	export class Literal extends Expression {
	}

	export class Integer extends Literal {
		constructor(i: number) {
			super();
			this.i = i;
		}

		i: number;
	}

	export class Variable extends Expression {
		constructor(name: string) {
			super();
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
			else if (token.content === "dim") {
				block.statements.push(this.dim());
			}
			else if (token.content === "end") {
				break;
			}
			else if (token.content === ":") {
				this.tokens.next();
			}
			else {
				const identifier = this.identifier();
				token = this.tokens.peek();

				if (token.content === "=") {
					block.statements.push(this.assignment(identifier));
				}
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

	private dim(): ast.Dim {
		this.tokens.next(); // consume keyword
		const name = this.require().content;
		return new ast.Dim(name);
	}

	private assignment(identifier: Bucket): ast.Assignment {
		this.tokens.next(); // consume operator
		return new ast.Assignment(identifier.content, this.expression());
	}

	private expression(): ast.Expression {
		const token = this.require();

		if (/[0-9]+/.test(token.content)) {
			return new ast.Integer(Number(token.content));
		}
		else if (this.isIdentifier(token)) {
			return new ast.Variable(token.content);
		}
		else {
			this.error(token, `cannot parse '${token.content}'`);
		}
	}

	private require(): Bucket {
		const token = this.tokens.next();
		if (token.content === null) {
			this.error(token, "unexpected end of file");
		}

		return token;
	}

	private identifier(): Bucket {
		const token = this.require();
		if (!this.isIdentifier(token)) {
			this.error(token, `expected identifier, got '${token.content}'`);
		}

		return token;
	}

	private isIdentifier(token: Bucket): boolean {
		return /[a-zA-Z_][a-zA-Z0-9_]*/.test(token.content)
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

