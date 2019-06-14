import { Context, Func, Box, Expr, DictObj } from "./NewContext";
import { Value } from "./Data";
import * as data from "./Data";
import { RuntimeError } from "../runtime/Error";
import { AccessLevel } from "./Access";

export namespace ast {

	export interface Statement {
		subStatements(): Statement[];
		execute(context: Context): void;
	}

	export class Block implements Statement {
		private body: Statement[];

		constructor(body: Statement[]) {
			this.body = body;
		}

		subStatements() {
			return this.body;
		}

		execute(context: Context): void {
			for (const stmt of this.body) {
				stmt.execute(context);
			}
		}
	}

	export namespace expr {
		export class Literal extends Expr {
			value: Value;

			constructor(value: Value) {
				super();
				this.value = value;
			}

			evaluate(context: Context): Box {
				return new Box(this.value);
			}

			toString() {
				return this.value.toString();
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

			evaluate(context: Context): any {
				throw "new not implemented";
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

			evaluate(context: Context): Box {
				// It's worth noting here that this way of implementing things
				// results in there being not lazy evaluation of AND and OR,
				// which is exactly how VBScript is supposed to work.
				const left = this.left.evaluate(context).get();
				const right = this.right.evaluate(context).get();

				if (left instanceof Value && right instanceof Value) {
					return new Box(this.op(left, right), true);
				}
				else {
					throw new RuntimeError(`type mismatch: ${left.toString()} ${this.symbol} ${right.toString()}`);
				}
			}

			toString(): string {
				return `(${this.left.toString()} ${this.symbol} ${this.right.toString()})`;
			}

			protected abstract symbol: string;
			protected abstract op(left: Value, right: Value): Value;
		}

		export abstract class NumericBinary extends Binary {
			op(left: Value, right: Value): Value {
				// TODO: type checking
				return new data.Number(this.o(left.value(), right.value()));
			}

			protected abstract o(left: number, right: number): number;
		}

		export abstract class Unary extends Expr {
			arg: Expr;

			constructor(arg: Expr) {
				super();
				this.arg = arg;
			}

			evaluate(context: Context): Box {
				// It's worth noting here that this way of implementing things
				// results in there being not lazy evaluation of AND and OR,
				// which is exactly how VBScript is supposed to work.
				const arg = this.arg.evaluate(context).get();

				if (arg instanceof Value) {
					return new Box(this.op(arg), true);
				}
				else {
					throw new RuntimeError("type mismatch");
				}
			}

			toString(): string {
				return `(${this.symbol} ${this.arg.toString()}`;
			}

			protected abstract symbol: string;
			protected abstract op(arg: Value): Value
		}

		export class Add extends NumericBinary {
			protected symbol = "+";
			o(x: number, y: number) {
				return x + y;
			}
		}

		export class Sub extends NumericBinary {
			protected symbol = "-";
			o(x: number, y: number) {
				return x - y;
			}
		}

		export class Mul extends NumericBinary {
			protected symbol = "*";
			o(x: number, y: number) {
				return x * y;
			}
		}

		export class Div extends NumericBinary {
			protected symbol = "/";
			o(x: number, y: number) {
				return x / y;
			}
		}

		export class Pow extends NumericBinary {
			protected symbol = "^";
			o(x: number, y: number) {
				return Math.pow(x, y);
			}
		}

		export class Mod extends NumericBinary {
			protected symbol = "%";
			o(x: number, y: number) {
				return x % y;
			}
		}

		export class Concat extends Binary {
			protected symbol = "&";
			op(x: Value, y: Value) {
				// TODO: type checking
				return x.value() + y.value();
			}
		}

		export class Equal extends Binary {
			protected symbol = "=";
			op(x: Value, y: Value) {
				return new data.Number(x.value() === y.value() ? data.TRUE : data.FALSE);
			}
		}

		export class Is extends Binary {
			protected symbol = "is";
			op(x: Value, y: Value): Value {
				throw "is operator not implemented";
			}
		}

		export class NotEqual extends Binary {
			protected symbol = "<>";
			op(x: Value, y: Value) {
				return new data.Number(x.value() !== y.value() ? data.TRUE : data.FALSE);
			}
		}

		export class LessThan extends NumericBinary {
			protected symbol = "<";
			o(x: number, y: number) {
				return x < y ? data.TRUE : data.FALSE;
			}
		}

		export class LessThanOrEqual extends NumericBinary {
			protected symbol = "<=";
			o(x: number, y: number) {
				return x <= y ? data.TRUE : data.FALSE;
			}
		}

		export class GreaterThan extends NumericBinary {
			protected symbol = ">";
			o(x: number, y: number) {
				return x > y ? data.TRUE : data.FALSE;
			}
		}

		export class GreaterThanOrEqual extends NumericBinary {
			protected symbol = ">=";
			o(x: number, y: number) {
				return x >= y ? data.TRUE : data.FALSE;
			}
		}

		export class And extends Binary {
			protected symbol = "and";
			op(x: Value, y: Value) {
				return new data.Number(x.value() & y.value());
			}
		}

		export class Or extends Binary {
			protected symbol = "or";
			op(x: Value, y: Value) {
				return new data.Number(x.value() | y.value());
			}
		}

		export class Xor extends Binary {
			protected symbol = "xor";
			op(x: Value, y: Value) {
				return new data.Number(x.value() ^ y.value());
			}
		}

		export class Not extends Unary {
			protected symbol = "not";
			op(x: Value) {
				return new data.Number(~x.value());
			}
		}
	}

	export interface LValue {

	}

	export class DummyStatement implements Statement {
		subStatements(): Statement[] {
			return [];
		}

		execute(context: Context) {

		}
	}

	export class Variable extends Expr implements LValue {
		components: string[];

		constructor(components: string[]) {
			super();
			this.components = components;
		}

		evaluate(context: Context): Box {
			let [first, ...rest] = this.components;
			let box = context.resolve(first);

			while (true) {
				if (rest.length === 0) {
					return box;
				}

				[first, ...rest] = rest;
				box = (<DictObj>box.get()).get(first);
			}
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

		evaluate(context: Context): Box {
			//console.log(`Function call ${this}`);
			const evaluatedArgs = this.args.map(a => a.evaluate(context));
			const evaluatedFunction = this.variable.evaluate(context);

			const func = evaluatedFunction.get();
			if (func instanceof Func) {
				return func.run(evaluatedArgs);
			}
			else {
				throw new RuntimeError("type mismatch: expected function");
			}
		}

		subStatements(): Statement[] {
			return [];
		}

		execute(context: Context) {
			this.evaluate(context);
		}

		toString(): string {
			return `${this.variable}(${this.args.map(x => x.toString()).join(", ")})`;
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

		execute(context: Context) {

		}
	}

	export class Dim implements Statement {
		name: string;
		length: number[];
		access: AccessLevel;

		constructor(name: string, length: number[], access: AccessLevel = AccessLevel.Public) {
			this.name = name;
			this.length = length;
			this.access = access;
		}

		subStatements(): Statement[] {
			return [];
		}

		execute(context: Context) {

		}
	}

	export class Redim implements Statement {
		name: string;
		length: number[];
		preserve: boolean;

		constructor(name: string, length: number[], preserve: boolean) {
			this.name = name;
			this.length = length;
			this.preserve = preserve;
		}

		subStatements(): Statement[] {
			return [];
		}

		execute(context: Context) {

		}
	}

	export class Argument {
		name: string;
		byRef: boolean;

		constructor(name: string, byRef: boolean = false) {
			this.name = name;
			this.byRef = byRef;
		}
	}

	export class Function implements Statement {
		name: string;
		args: Argument[];
		body: Statement[];
		access: AccessLevel;

		constructor(name: string, args: Argument[], body: Statement[], access: AccessLevel = AccessLevel.Public) {
			this.name = name;
			this.args = args;
			this.body = body;
			this.access = access;
		}

		subStatements(): Statement[] {
			return [];
		}

		execute(context: Context) {
			// Do nothing when executing; function definitions are handled at the hoist stage
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

		execute(context: Context) {
			// Do nothing when executing; class definitions are handled at the hoist stage
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

		execute(context: Context) {
			console.log(`if ${this.condition} ...`);
		}
	}

	export class Include implements Statement {
		file: string;
		virtual: boolean;

		constructor(file: string, virtual: boolean) {
			this.file = file;
			this.virtual = virtual;
		}

		execute(context: Context) {
			throw "includes not implemented";
		}

		subStatements(): Statement[] {
			throw "includes not implemented";
		}
	}

	export enum ExitType {
		Function,
		Sub,
		Do,
		For,
		Loop
	}

	export class Exit implements Statement {
		type: ExitType;

		constructor(type: ExitType) {
			this.type = type;
		}

		execute(context: Context) {
			throw "exit not implemented";
		}

		subStatements(): Statement[] {
			throw "exit not implemented";
		}
	}

	export enum OptionType {
		Explicit,
	}

	export class Option implements Statement {
		type: OptionType;

		constructor(type: OptionType) {
			this.type = type;
		}

		execute(context: Context) {
			throw "option not implemented";
		}

		subStatements(): Statement[] {
			throw "option not implemented";
		}
	}

	export enum ErrorHandling {
		ResumeNext, Goto0
	}

	export class OnError implements Statement {
		handling: ErrorHandling;

		constructor(handling: ErrorHandling) {
			this.handling = handling;
		}

		execute(context: Context) {
			throw "on error not implemented";
		}

		subStatements(): Statement[] {
			throw "on error not implemented";
		}
	}

	export class SelectCase {
		condition: Expr;
		body: Statement[];

		constructor(condition: Expr, body: Statement[]) {
			this.condition = condition;
			this.body = body;
		}
	}

	export class Select implements Statement {
		expr: Expr;
		cases: SelectCase[];

		constructor(expr: Expr, cases: SelectCase[]) {
			this.expr = expr;
			this.cases = cases;
		}

		execute(context: Context) {
			throw "select not implemented";
		}

		subStatements(): Statement[] {
			throw "select not implemented";
		}
	}

	export class With implements Statement {
		object: Expr;
		body: Statement[];

		constructor(object: Expr, body: Statement[]) {
			this.object = object;
			this.body = body;
		}

		execute(context: Context) {
			throw "with not implemented";
		}

		subStatements(): Statement[] {
			throw "with not implemented";
		}
	}

	export class Loop implements Statement {
		condition: Expr;
		body: Statement[];
		until: boolean;
		post: boolean;

		constructor(condition: Expr, body: Statement[], until: boolean, post: boolean) {
			this.condition = condition;
			this.body = body;
			this.until = until;
			this.post = post;
		}

		execute(context: Context) {
			throw "loop not implemented";
		}

		subStatements(): Statement[] {
			throw "loop not implemented";
		}
	}

	export enum PropertyType {
		Get, Let, Set
	}

	export class Property implements Statement {
		type: PropertyType;
		func: Func;
		def: boolean;
		access: AccessLevel;

		constructor(type: PropertyType, func: Func, def: boolean, access: AccessLevel) {
			this.type = type;
			this.func = func;
			this.def = def;
			this.access = access;
		}

		execute(context: Context) {
			throw "property not implemented";
		}

		subStatements(): Statement[] {
			throw "property not implemented";
		}
	}
}
