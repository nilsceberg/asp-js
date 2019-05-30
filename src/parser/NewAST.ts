import { Expr } from "parser-monad";

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

	export class Function {
		name: string;
		args: Argument[];
		body: Statement[];

		constructor(name: string, args: Argument[], body: Statement[]) {
			this.name = name;
			this.args = args;
			this.body = body;
		}
	}

	export class Class {
		name: string;
		declarations: Statement[];

		constructor(name: string, declarations: Statement[]) {
			this.name = name;
			this.declarations = declarations;
		}
	}
}
