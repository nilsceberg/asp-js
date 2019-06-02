export namespace ast {
	export interface Statement {

	}

	export interface Expr extends Statement {
		value(): any;
	}

	export namespace expr {
		export class String implements Expr {
			str: string;

			constructor(str: string) {
				this.str = str;
			}

			value(): string {
				return this.str;
			}
		}
		
		export class Number implements Expr {
			val: number;

			constructor(val: number) {
				this.val = val;
			}

			value(): number {
				return this.val;
			}

			toString(): string {
				return `${this.val}`;
			}
		}

		export class Boolean implements Expr {
			val: boolean;

			constructor(val: boolean) {
				this.val = val;
			}

			value(): number {
				// TODO: correct?
				return this.val ? 1 : 0;
			}

			toString(): string {
				return this.val ? "true" : "false";
			}
		}

		export class Nothing implements Expr {
			value() {
				throw "'nothing' not implemented";
			}

			toString(): string {
				return "nothing";
			}
		}

		export class Empty implements Expr {
			value() {
				throw "'empty' not implemented";
			}

			toString(): string {
				return "empty";
			}
		}

		export class Null implements Expr {
			value() {
				throw "'null' not implemented";
			}

			toString(): string {
				return "null";
			}
		}

		export abstract class Binary implements Expr {
			left: Expr;
			right: Expr;

			constructor(left: Expr, right: Expr) {
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
				return x === y;
			}
		}

		export class NotEqual extends Binary {
			protected symbol = "<>";
			op(x: any, y: any) {
				return x !== y;
			}
		}

		export class LessThan extends Binary {
			protected symbol = "<";
			op(x: any, y: any) {
				return x < y;
			}
		}

		export class LessThanOrEqual extends Binary {
			protected symbol = "<=";
			op(x: any, y: any) {
				return x <= y;
			}
		}

		export class GreaterThan extends Binary {
			protected symbol = ">";
			op(x: any, y: any) {
				return x > y;
			}
		}

		export class GreaterThanOrEqual extends Binary {
			protected symbol = ">=";
			op(x: any, y: any) {
				return x >= y;
			}
		}

		export class And extends Binary {
			protected symbol = "and";
			op(x: boolean, y: boolean) {
				return x && y;
			}
		}

		export class Or extends Binary {
			protected symbol = "or";
			op(x: boolean, y: boolean) {
				return x || y;
			}
		}

		export class Xor extends Binary {
			protected symbol = "xor";
			op(x: boolean, y: boolean) {
				return x !== y;
			}
		}
	}

	export interface LValue {

	}

	export class DummyStatement implements Statement {
		
	}

	export class Variable implements LValue, Expr {
		components: string[];

		constructor(components: string[]) {
			this.components = components;
		}

		value(): any {
			throw "variables not implemented";
		}
	}

	export class FunctionCall implements LValue, Expr {
		variable: Variable;
		args: Expr[];

		constructor(variable: Variable, args: Expr[]) {
			this.variable = variable;
			this.args = args;
		}

		value(): any {
			throw "functions not implemented";
		}
	}

	export class Assignment implements Statement {
		lvalue: LValue;
		rvalue: Expr;

		constructor(lvalue: LValue, rvalue: Expr) {
			this.lvalue = lvalue;
			this.rvalue = rvalue;
		}
	}

	export class Dim implements Statement {
		name: string;

		constructor(name: string) {
			this.name = name;
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
	}

	export class Class implements Statement {
		name: string;
		declarations: Statement[];

		constructor(name: string, declarations: Statement[]) {
			this.name = name;
			this.declarations = declarations;
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
	}
}
