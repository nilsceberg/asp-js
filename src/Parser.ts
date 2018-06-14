import { Bucket } from "./Stream";
import { TokenStream } from "./TokenStream";

export namespace ast {
	export class Block {
		constructor(statements: Statement[]) {
			this.statements = statements;
		}

		statements: Statement[];
	}

	export class Statement {
	}

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
	}

	export class Dim extends Statement {
		constructor(name: string) {
			super();
			this.name = name;
		}

		name: string;
	}

	export class Assignment extends Statement {
		constructor(variable: string, expr: Expression) {
			super();
			this.variable = variable;
			this.expr = expr;
		}

		variable: string;
		expr: Expression;
	}

	export class Expression {
	}

	export class Mul extends Expression {
		constructor(left: Expression, right: Expression) {
			super();
			this.left = left;
			this.right = right;
		}

		left: Expression;
		right: Expression;
	}

	export class Add extends Expression {
		constructor(left: Expression, right: Expression) {
			super();
			this.left = left;
			this.right = right;
		}

		left: Expression;
		right: Expression;
	}

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
		constructor(name: string[]) {
			super();
			this.name = name;
		}

		name: string[];
	}

	export class Call extends Expression {
		constructor(f: Expression, args: Expression[]) {
			super();
			this.f = f;
			this.args = args;
		}

		f: Expression;
		args: Expression[];
	}
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
			console.log("block", token);
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
				let expression = this.expression();

				// If this is a variable, check to see if we're actually on
				// an assignment
				if ((expression instanceof ast.Variable)
					&& expression.name.length === 1
					&& this.tokens.peek().content === "=") {
					expression = this.assignment(expression.name[0]);
				}

				block.statements.push(expression);
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

	private assignment(identifier: string): ast.Assignment {
		this.tokens.next(); // consume operator
		return new ast.Assignment(identifier, this.expression());
	}

	private expression(): ast.Expression {
		let expr: ast.Expression = this.term();
		while (this.tokens.peek().content === "+") {
			this.tokens.next();
			expr = new ast.Add(expr, this.term());
		}
		return expr;
	}

	private term(): ast.Expression {
		let term: ast.Expression = this.factor();
		while (this.tokens.peek().content === "*") {
			this.tokens.next();
			term = new ast.Mul(term, this.factor());
		}
		return term;
	}

	private factor(): ast.Expression {
		const token = this.require();
		let expr: ast.Expression;
		console.log("factor", token);

		if (token.content === "(") {
			expr = this.expression();
			this.expect(")");
		}
		else if (this.isInteger(token)) {
			expr = new ast.Integer(Number(token.content));
		}
		else if (this.isIdentifier(token)) {
			expr = this.variable(token);
		}
		else {
			this.error(token, `unexpected token '${token.content}'`);
		}

		// Is this a function call?
		if (this.tokens.peek().content === "(") {
			expr = this.call(expr);
		}
		//else if (this.isValue(this.tokens.peek())) {
		//	expr = new ast.Call(expr, [this.expression()]);
		//}

		return expr;
	}

	private variable(token: Bucket): ast.Variable {
		const variable = new ast.Variable([token.content]);
		while (this.tokens.peek().content === ".") {
			this.tokens.next();
			variable.name.push(this.identifier().content);
		}
		return variable;
	}

	private call(f: ast.Expression): ast.Call {
		const call = new ast.Call(f, []);
		this.expect("(");
		if (this.tokens.peek().content !== ")") {
			call.args.push(this.expression());
			while (this.tokens.peek().content === ",") {
				this.tokens.next();
				call.args.push(this.expression());
			}
		}
		this.expect(")");
		return call;
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
		return /[a-zA-Z_][a-zA-Z0-9_]*/.test(token.content);
	}

	private isInteger(token: Bucket): boolean {
		return /[0-9]+/.test(token.content);
	}

	private isLiteral(token: Bucket): boolean {
		return this.isInteger(token); 
	}

	private isValue(token: Bucket): boolean {
		return this.isLiteral(token) || this.isIdentifier(token);
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

