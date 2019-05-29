import { Expr } from "parser-monad";

export namespace ast {
	export interface LValue {

	}

	export class Variable implements LValue {
		components: string[];
		constructor(components: string[]) {
			this.components = components;
		}
	}

	export class FunctionCall implements LValue {
		variable: Variable;
		args: Expr[];

		constructor(variable: Variable, args: Expr[]) {
			this.variable = variable;
			this.args = args;
		}
	}
}
