import * as util from "util";

export namespace ast {
	// TODO: sort these values out
	export const TRUE = -1;
	export const FALSE = 0;

	export interface Statement {
		subStatements(): Statement[];
	}

	export abstract class Expr {
		abstract value(): any;

		[util.inspect.custom](depth: number, opts: any): string {
			return this.toString();
		}
	}

	export abstract class Value extends Expr {
	}

	export namespace expr {
		export class String extends Value {
			str: string;

			constructor(str: string) {
				super();
				this.str = str;
			}

			value(): string {
				return this.str;
			}
		}
		
		export class Number extends Value {
			val: number;

			constructor(val: number) {
				super();
				this.val = val;
			}

			value(): number {
				return this.val;
			}

			toString(): string {
				return `${this.val}`;
			}
		}

		export class New extends Expr {
			what: ast.Variable;

			constructor(what: ast.Variable) {
				super();
				this.what = what;
			}

			toString(): string {
				return `new ${this.what.toString()}`;
			}

			value(): any {
				throw "new not implemented";
			}
		}

		export class Boolean extends Value {
			val: boolean;

			constructor(val: boolean) {
				super();
				this.val = val;
			}

			value(): number {
				// TODO: correct?
				return this.val ? TRUE : FALSE;
			}

			toString(): string {
				return this.val ? "true" : "false";
			}
		}

		export class Nothing extends Value {
			value() {
				throw "'nothing' not implemented";
			}

			toString(): string {
				return "nothing";
			}
		}

		export class Empty extends Value {
			value() {
				throw "'empty' not implemented";
			}

			toString(): string {
				return "empty";
			}
		}

		export class Null extends Value {
			value() {
				throw "'null' not implemented";
			}

			toString(): string {
				return "null";
			}
		}

		export abstract class Binary extends Expr {
			left: Expr;
			right: Expr;

			constructor(left: Expr, right: Expr) {
				super();
				this.left = left;
				this.right = right;
			}

			value(): any {
				// It's worth noting here that this way of implementing things
				// results in there being not lazy evaluation of AND and OR,
				// which is exactly how VBScript is supposed to work.
				return this.op(this.left.value(), this.right.value());
			}

			toString(): string {
				return `(${this.left.toString()} ${this.symbol} ${this.right.toString()})`;
			}

			protected abstract symbol: string;
			protected abstract op(left: any, right: any): any;
		}

		export abstract class Unary extends Expr {
			arg: Expr;

			constructor(arg: Expr) {
				super();
				this.arg = arg;
			}

			value(): any {
				// It's worth noting here that this way of implementing things
				// results in there being not lazy evaluation of AND and OR,
				// which is exactly how VBScript is supposed to work.
				return this.op(this.arg.value());
			}

			toString(): string {
				return `(${this.symbol} ${this.arg.toString()}`;
			}

			protected abstract symbol: string;
			protected abstract op(arg: any): any;
		}

		export class Add extends Binary {
			protected symbol = "+";
			op(x: number, y: number) {
				return x + y;
			}
		}

		export class Sub extends Binary {
			protected symbol = "-";
			op(x: number, y: number) {
				return x - y;
			}
		}

		export class Mul extends Binary {
			protected symbol = "*";
			op(x: number, y: number) {
				return x * y;
			}
		}

		export class Div extends Binary {
			protected symbol = "/";
			op(x: number, y: number) {
				return x / y;
			}
		}

		export class Pow extends Binary {
			protected symbol = "^";
			op(x: number, y: number) {
				return Math.pow(x, y);
			}
		}

		export class Mod extends Binary {
			protected symbol = "%";
			op(x: number, y: number) {
				return x % y;
			}
		}

		export class Concat extends Binary {
			protected symbol = "&";
			op(x: string, y: string) {
				return x + y;
			}
		}

		export class Equal extends Binary {
			protected symbol = "=";
			op(x: any, y: any) {
				return x === y ? TRUE : FALSE;
			}
		}

		export class NotEqual extends Binary {
			protected symbol = "<>";
			op(x: any, y: any) {
				return x !== y ? TRUE : FALSE;
			}
		}

		export class LessThan extends Binary {
			protected symbol = "<";
			op(x: any, y: any) {
				return x < y ? TRUE : FALSE;
			}
		}

		export class LessThanOrEqual extends Binary {
			protected symbol = "<=";
			op(x: any, y: any) {
				return x <= y ? TRUE : FALSE;
			}
		}

		export class GreaterThan extends Binary {
			protected symbol = ">";
			op(x: any, y: any) {
				return x > y ? TRUE : FALSE;
			}
		}

		export class GreaterThanOrEqual extends Binary {
			protected symbol = ">=";
			op(x: any, y: any) {
				return x >= y ? TRUE : FALSE;
			}
		}

		export class And extends Binary {
			protected symbol = "and";
			op(x: number, y: number) {
				return x & y;
			}
		}

		export class Or extends Binary {
			protected symbol = "or";
			op(x: number, y: number) {
				return x | y;
			}
		}

		export class Xor extends Binary {
			protected symbol = "xor";
			op(x: number, y: number) {
				return x ^ y;
			}
		}

		export class Not extends Unary {
			protected symbol = "not";
			op(x: number) {
				return ~x;
			}
		}
	}

	export interface LValue {

	}

	export class DummyStatement implements Statement {
		subStatements(): Statement[] {
			return [];
		}
	}

	export class Variable extends Expr implements LValue {
		components: string[];

		constructor(components: string[]) {
			super();
			this.components = components;
		}

		value(): any {
			throw "variables not implemented";
		}

		toString() {
			return this.components.join(".");
		}
	}

	export class FunctionCall extends Expr implements LValue, Statement {
		variable: Variable;
		args: Expr[];

		constructor(variable: Variable, args: Expr[]) {
			super();
			this.variable = variable;
			this.args = args;
		}

		value(): any {
			throw "functions not implemented";
		}

		subStatements(): Statement[] {
			return [];
		}
	}

	export class Assignment implements Statement {
		lvalue: LValue;
		rvalue: Expr;

		constructor(lvalue: LValue, rvalue: Expr) {
			this.lvalue = lvalue;
			this.rvalue = rvalue;
		}

		subStatements(): Statement[] {
			return [];
		}
	}

	export class Dim implements Statement {
		name: string;
		length: number;

		constructor(name: string, length: number) {
			this.name = name;
			this.length = length;
		}

		subStatements(): Statement[] {
			return [];
		}
	}

	export class Argument {
		name: string;

		constructor(name: string) {
			this.name = name;
		}
	}

	export class Function implements Statement {
		name: string;
		args: Argument[];
		body: Statement[];

		constructor(name: string, args: Argument[], body: Statement[]) {
			this.name = name;
			this.args = args;
			this.body = body;
		}

		subStatements(): Statement[] {
			return [];
		}
	}

	export class Class implements Statement {
		name: string;
		declarations: Statement[];

		constructor(name: string, declarations: Statement[]) {
			this.name = name;
			this.declarations = declarations;
		}

		subStatements(): Statement[] {
			return [];
		}
	}

	export class If implements Statement {
		condition: Expr;
		body: Statement[];
		elseBody: Statement[];

		constructor(condition: Expr, body: Statement[], elseBody: Statement[]) {
			this.condition = condition;
			this.body = body;
			this.elseBody = elseBody;
		}

		subStatements(): Statement[] {
			return this.body.concat(this.elseBody);
		}
	}
}
