import { Expr } from "parser-monad";
import { strict } from "assert";

export namespace ast {
	export interface LValue {

	}

	export interface Statement {

	}

	export class DummyStatement implements Statement {
		
	}

	export class Variable implements LValue, Statement {
		components: string[];

		constructor(components: string[]) {
			this.components = components;
		}
	}

	export class FunctionCall implements LValue, Statement {
		variable: Variable;
		args: Expr[];

		constructor(variable: Variable, args: Expr[]) {
			this.variable = variable;
			this.args = args;
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

	export namespace expr {
		export interface Expr {
			value(): any;
		}

		export class String implements Expr {
			str: string;

			constructor(str: string) {
				this.str = str;
			}

			value(): string {
				return this.str;
			}
		}
	}
}
