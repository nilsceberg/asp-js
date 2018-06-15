import { Bucket } from "./Stream";
import { TokenStream, tokens } from "./TokenStream";
import { ast } from "./AST";

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
			if (token.content instanceof tokens.Inline) {
				this.tokens.next();
				block.statements.push(new ast.Call(token,
					new ast.Variable(token, ["response", "write"]),
					[new ast.Literal(token, token.content.value)]));
			}
			else if (token.content instanceof tokens.Identifier) {
				if (token.content.value === "function") {
					block.statements.push(this.function());
				}
				else if (token.content.value === "sub") {
					block.statements.push(this.function(false));
				}
				else if (token.content.value === "class") {
					block.statements.push(this.klass());
				}
				else if (token.content.value === "dim") {
					block.statements.push(this.dim());
				}
				else if (token.content.value === "set") {
					// TODO: can we just ignore set?
					this.tokens.next();
				}
				else if (token.content.value === "end") {
					break;
				}
				else {
					// TODO: might have to change this to allow for weird set
					// syntax
					const variable = this.variable();

					if (this.tokens.peek().content.value === "=") {
						block.statements.push(this.assignment(variable));
					}
					else {
						block.statements.push(this.callStatement(variable));
					}
				}
			}
			else if (token.content instanceof tokens.Punctuation) {
				if (token.content.value === ":") {
					this.tokens.next();
				}
				else {
					this.error(token, `unexpected token '${token.content.value}' (expected statement)`);
				}
			}
			else {
				this.error(token, `unexpected token '${token.content.value}' (expected statement)`);
			}
		}

		return block;
	}

	private function(func: boolean = true): ast.Function {
		const keyword = this.tokens.next(); // consume keyword

		const name = this.require(tokens.Identifier);

		this.expect("(");
		const args = this.argList();
		this.expect(")");
		this.expect(":");

		const f = new ast.Function(keyword, new ast.Variable(name, [name.content.value]), args, this.block());

		this.expect("end");
		this.expect(func ? "function" : "sub");

		return f;
	}

	private klass(): ast.Class {
		const keyword = this.tokens.next(); // consume keyword

		const name = this.require(tokens.Identifier).content.value;

		const k = new ast.Class(keyword, name, [], []);

		let token;
		while ((token = this.tokens.peek()).content.value !== "end") {
			if (token.content.value === "dim") {
				k.dims.push(this.dim());
			}
			else if (token.content.value === "function" || token.content.value === "sub") {
				k.methods.push(this.function(token.content.value === "function"));
			}
			else if (token.content.value === ":") {
				this.tokens.next();
			}
			else {
				this.error(token, `unexpected token '${token.content.value}'`);
			}
		}

		this.expect("end");
		this.expect("class");

		return k;
	}

	private argList(): ast.Variable[] {
		let variables: ast.Variable[] = [];
		while (this.tokens.peek().content.value !== ")") {
			const token = this.require(tokens.Identifier);
			variables.push(new ast.Variable(token, [token.content.value]));

			if (this.tokens.peek().content.value === ")") {
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
		const name = this.require(tokens.Identifier).content.value;
		return new ast.Dim(keyword, name);
	}

	private assignment(leftHand: ast.Expression): ast.Assignment {
		const operator = this.tokens.next(); // consume operator
		return new ast.Assignment(operator, leftHand, this.expression());
	}

	private expression(): ast.Expression {
		let expr: ast.Expression = this.term();
		while (this.tokens.peek().content.value === "+") {
			const operator = this.tokens.next();
			expr = new ast.Add(operator, expr, this.term());
		}
		return expr;
	}

	private term(): ast.Expression {
		let term: ast.Expression = this.factor();
		while (this.tokens.peek().content.value === "*") {
			const operator = this.tokens.next();
			term = new ast.Mul(operator, term, this.factor());
		}
		return term;
	}

	private factor(): ast.Expression {
		const token = this.tokens.peek();
		let expr: ast.Expression;

		if (this.isLiteral(token)) {
			expr = new ast.Literal(token, this.tokens.next().content.value);
		}
		else if (this.isIdentifier(token)) {
			if (token.content.value === "new") {
				return this.new();
			}
			else {
				expr = this.variable();
			}
		}
		else if (token.content.value === "(") {
			this.tokens.next();
			expr = this.expression();
			this.expect(")");
		}
		else {
			this.error(token, `unexpected token '${token.content.value}'`);
		}

		// Is this a function call?
		if (this.tokens.peek().content.value === "(") {
			expr = this.call(expr);
		}

		return expr;
	}

	private new(): ast.New {
		const keyword = this.tokens.next();
		return new ast.New(keyword, this.tokens.next().content.value);
	}

	private variable(): ast.Variable {
		const variable = new ast.Variable(this.tokens.peek(), [this.tokens.next().content.value]);
		while (this.tokens.peek().content.value === ".") {
			this.tokens.next();
			variable.name.push(this.require(tokens.Identifier).content.value);
		}
		return variable;
	}

	private call(f: ast.Expression): ast.Call {
		return new ast.Call(f.bucket, f, this.args());
	}

	private callStatement(f: ast.Expression): ast.Call {
		const call = new ast.Call(f.bucket, f, []);
		if (this.tokens.peek().content.value === ":") {
			return call;
		}

		call.args.push(this.expression());

		while (this.tokens.peek().content.value === ",") {
			this.tokens.next();
			call.args.push(this.expression());
		}
		return call;
	}

	private args(): ast.Expression[] {
		let args: ast.Expression[] = [];
		this.expect("(");
		if (this.tokens.peek().content.value !== ")") {
			args.push(this.expression());
			while (this.tokens.peek().content.value === ",") {
				this.tokens.next();
				args.push(this.expression());
			}
		}
		this.expect(")");
		return args;
	}

	private require(type: Function): Bucket {
		const token = this.tokens.next();
		if (token.content === null) {
			this.error(token, "unexpected end of file");
		}

		if (!(token.content instanceof type)) {
			this.error(token, `expected ${type.name}, got '${token.content}'`);
		}

		return token;
	}

	private isIdentifier(token: Bucket): boolean {
		return token.content instanceof tokens.Identifier;
	}

	private isInteger(token: Bucket): boolean {
		return token.content instanceof tokens.Integer;
	}

	private isString(token: Bucket): boolean {
		return token.content instanceof tokens.String;
	}

	private isLiteral(token: Bucket): boolean {
		return this.isInteger(token) || this.isString(token);
	}

	private isValue(token: Bucket): boolean {
		return this.isLiteral(token) || this.isIdentifier(token);
	}
		
	private expect(expected: string) {
		const actual = this.require(tokens.Token); // allow any kind of token here
		if (actual.content.value !== expected) {
			this.error(actual, `expected '${expected}', got '${actual.content.value}'`);
		}
	}

	private error(bucket: Bucket, message: string) {
		throw new Error(`syntax error in ${bucket.filename} at line ${bucket.line}, column ${bucket.position}: ${message}`);
	}

	private tokens: TokenStream;
}

