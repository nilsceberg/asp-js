import { Bucket } from "./Stream";
import { TokenStream } from "./TokenStream";
import { ast, namespaces } from "./AST";

export class Parser {
	constructor(tokens: TokenStream) {
		this.tokens = tokens;
	}

	parse(): ast.Block {
		return this.block();
	}

	private block(): ast.Block {
		let block = new ast.Block(this.tokens.peek(), []);

		let token: Bucket;
		while ((token = this.tokens.peek()).content !== null) {
			if (token.content === "function") {
				block.statements.push(this.function());
			}
			else if (token.content === "sub") {
				block.statements.push(this.function(false));
			}
			else if (token.content === "class") {
				block.statements.push(this.klass());
			}
			else if (token.content === "dim") {
				block.statements.push(this.dim());
			}
			else if (token.content === "set") {
				// TODO: can we just ignore set?
				this.tokens.next();
			}
			else if (token.content === "end") {
				break;
			}
			else if (this.isIdentifier(token)) {
				const variable = this.variable();

				if (this.tokens.peek().content === "=") {
					block.statements.push(this.assignment(variable.name));
				}
				else {
					block.statements.push(this.callStatement(variable));
				}
			}
			else if (token.content === ":") {
				this.tokens.next();
			}
			else {
				this.error(token, `unexpected token '${token.content}' (expected statement)`);
			}
		}

		return block;
	}

	private function(func: boolean = true): ast.Function {
		const keyword = this.tokens.next(); // consume keyword

		const name = this.require().content;

		this.expect("(");
		const args = this.argList();
		this.expect(")");
		this.expect(":");

		const f = new ast.Function(keyword, name, args, this.block());

		this.expect("end");
		this.expect(func ? "function" : "sub");

		return f;
	}

	private klass(): ast.Class {
		const keyword = this.tokens.next(); // consume keyword

		const name = this.identifier().content;

		const k = new ast.Class(keyword, name, [], []);

		let token;
		while ((token = this.tokens.peek()).content !== "end") {
			if (token.content === "dim") {
				k.dims.push(this.dim());
			}
			else if (token.content === "function" || token.content === "sub") {
				k.methods.push(this.function(token.content === "function"));
			}
			else if (token.content === ":") {
				this.tokens.next();
			}
			else {
				this.error(token, `unexpected token '${token.content}'`);
			}
		}

		this.expect("end");
		this.expect("class");

		return k;
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
		const keyword = this.tokens.next(); // consume keyword
		const name = this.require().content;
		return new ast.Dim(keyword, name);
	}

	private assignment(identifier: string[]): ast.Assignment {
		const operator = this.tokens.next(); // consume operator
		return new ast.Assignment(operator, identifier, this.expression());
	}

	private expression(): ast.Expression {
		let expr: ast.Expression = this.term();
		while (this.tokens.peek().content === "+") {
			const operator = this.tokens.next();
			expr = new ast.Add(operator, expr, this.term());
		}
		return expr;
	}

	private term(): ast.Expression {
		let term: ast.Expression = this.factor();
		while (this.tokens.peek().content === "*") {
			const operator = this.tokens.next();
			term = new ast.Mul(operator, term, this.factor());
		}
		return term;
	}

	private factor(): ast.Expression {
		const token = this.tokens.peek();
		let expr: ast.Expression;

		if (token.content === "(") {
			this.tokens.next();
			expr = this.expression();
			this.expect(")");
		}
		else if (token.content === "new") {
			return this.new();
		}
		else if (this.isInteger(token)) {
			expr = new ast.Integer(token, Number(this.tokens.next().content));
		}
		else if (this.isIdentifier(token)) {
			expr = this.variable();
		}
		else {
			this.error(token, `unexpected token '${token.content}'`);
		}

		// Is this a function call?
		if (this.tokens.peek().content === "(") {
			expr = this.call(expr);
		}

		return expr;
	}

	private new(): ast.New {
		const keyword = this.tokens.next();
		return new ast.New(keyword, this.tokens.next().content);
	}

	private variable(): ast.Variable {
		const variable = new ast.Variable(this.tokens.peek(), [this.tokens.next().content], namespaces.Var);
		while (this.tokens.peek().content === ".") {
			this.tokens.next();
			variable.name.push(this.identifier().content);
		}
		return variable;
	}

	private call(f: ast.Expression): ast.Call {
		return new ast.Call(f.bucket, f, this.args());
	}

	private callStatement(f: ast.Expression): ast.Call {
		const call = new ast.Call(f.bucket, f, []);
		if (this.tokens.peek().content === ":") {
			return call;
		}

		call.args.push(this.expression());

		while (this.tokens.peek().content === ",") {
			this.tokens.next();
			call.args.push(this.expression());
		}
		return call;
	}

	private args(): ast.Expression[] {
		let args: ast.Expression[] = [];
		this.expect("(");
		if (this.tokens.peek().content !== ")") {
			args.push(this.expression());
			while (this.tokens.peek().content === ",") {
				this.tokens.next();
				args.push(this.expression());
			}
		}
		this.expect(")");
		return args;
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
		return /[a-zA-Z_][a-zA-Z0-9._]*/.test(token.content);
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
		throw new Error(`syntax error in ${bucket.filename} at line ${bucket.line}, column ${bucket.position}: ${message}`);
	}

	private tokens: TokenStream;
}

