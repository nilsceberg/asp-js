import { Context, Func, Box, Expr, DictObj, Obj } from "./NewContext";
import { Value } from "./Data";
import * as data from "./Data";
import { RuntimeError } from "../runtime/Error";
import { AccessLevel } from "./Access";
import { cons } from "parser-monad";
import { VBFunc } from "../runtime/Scope";
import { Script } from "../runtime/Script";

export namespace ast {
	export interface Metadata {
		filename: string;
	}

	export interface Statement {
		preprocess(metadata: Metadata): void;
		hoist(context: Context): void;
		execute(context: Context): void;
	}

	export class Block implements Statement {
		private body: Statement[];

		constructor(body: Statement[]) {
			this.body = body;
		}

		execute(context: Context): void {
			for (const stmt of this.body) {
				stmt.execute(context);
			}
		}

		hoist(context: Context): void {
			for (const stmt of this.body) {
				stmt.hoist(context);
			}
		}

		preprocess(metadata: Metadata): void {
			for (const stmt of this.body) {
				stmt.preprocess(metadata);
			}
		}

		static blockCons([x, xs]: [Statement, Block]): Block {
			return new Block(cons([x, xs.body]));
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
			what: Expr;

			constructor(what: Expr) {
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

		export class LongDiv extends NumericBinary {
			protected symbol = "\\";
			o(x: number, y: number) {
				return Math.floor(x / y);
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
		evaluate(context: Context): Box;
	}

	export class DummyStatement implements Statement {
		subStatements(): Statement[] {
			return [];
		}

		execute(context: Context) {

		}

		hoist(context: Context) {

		}

		preprocess(): void {

		}
	}

	export class Variable extends Expr implements LValue {
		name: string;

		constructor(name: string) {
			super();
			this.name = name;
		}

		evaluate(context: Context): Box {
			return context.resolve(this.name);
		}

		toString() {
			return this.name;
		}
	}

	export class Access extends Expr implements LValue {
		object: Expr;
		member: string;

		constructor(object: Expr, member: string) {
			super();
			this.object = object;
			this.member = member;
		}

		evaluate(context: Context): Box {
			const parent = <Obj>this.object.evaluate(context).get();
			const value = parent.get(this.member);
			return value;
		}

		toString() {
			return `${this.object}.${this.member}`;
		}
	}

	export class FunctionCall extends Expr implements LValue, Statement {
		callee: Expr;
		args: Expr[];

		constructor(callee: Expr, args: Expr[]) {
			super();
			this.callee = callee;
			this.args = args;
		}

		evaluate(context: Context): Box {
			//console.log(`Function call ${this}`);
			const evaluatedArgs = this.args.map(a => a.evaluate(context));
			const evaluatedFunction = this.callee.evaluate(context);

			const func = evaluatedFunction.get();
			if (func instanceof Func) {
				return func.run(evaluatedArgs);
			}
			else {
				throw new RuntimeError("type mismatch: expected function");
			}
		}

		preprocess(): void {

		}

		hoist(context: Context) {

		}

		execute(context: Context) {
			this.evaluate(context);
		}

		toString(): string {
			return `${this.callee}(${this.args.map(x => x.toString()).join(", ")})`;
		}
	}

	export class Assignment implements Statement {
		lvalue: LValue;
		rvalue: Expr;

		constructor(lvalue: LValue, rvalue: Expr) {
			this.lvalue = lvalue;
			this.rvalue = rvalue;
		}

		execute(context: Context) {
			const box = this.lvalue.evaluate(context);
			const value = this.rvalue.evaluate(context).get();
			box.set(value);
		}

		hoist(context: Context) {

		}

		preprocess(): void {

		}
	}

	export class Const implements Statement {
		name: string;
		value: expr.Literal;

		constructor(name: string, value: expr.Literal) {
			this.name = name;
			this.value = value;
		}

		preprocess(): void {

		}

		hoist(context: Context): void {
			context.declare(this.name, this.value.value);
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

		preprocess(): void {

		}

		hoist(context: Context): void {
			context.declare(this.name);
		}

		execute(context: Context) {
			// do nothing
		}
	}

	export class Redim implements Statement {
		name: string;
		length: Expr[];
		preserve: boolean;

		constructor(name: string, length: Expr[], preserve: boolean) {
			this.name = name;
			this.length = length;
			this.preserve = preserve;
		}

		preprocess(): void {

		}

		hoist(): void {
			throw "redim not implemented";
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
		body: Statement;
		access: AccessLevel;

		constructor(name: string, args: Argument[], body: Statement, access: AccessLevel = AccessLevel.Public) {
			this.name = name;
			this.args = args;
			this.body = body;
			this.access = access;
		}

		preprocess(metadata: Metadata): void {
			this.body.preprocess(metadata);
		}

		hoist(context: Context): void {
			context.declare(this.name, new VBFunc(this, context));
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

		preprocess(metadata: Metadata): void {
			for (let declaration of this.declarations) {
				declaration.preprocess(metadata);
			}
		}

		hoist(): void {
			throw "class not implemented";
		}

		execute(context: Context) {
			// Do nothing when executing; class definitions are handled at the hoist stage
		}
	}

	export class If implements Statement {
		condition: Expr;
		body: Statement;
		elseBody: Statement;

		constructor(condition: Expr, body: Statement, elseBody: Statement) {
			this.condition = condition;
			this.body = body;
			this.elseBody = elseBody;
		}

		preprocess(metadata: Metadata): void {
			this.body.preprocess(metadata);
			this.elseBody.preprocess(metadata);
		}

		hoist(context: Context): void {
			this.body.hoist(context);
			this.elseBody.hoist(context);
		}

		execute(context: Context) {
			console.log(`if ${this.condition} ...`);
		}
	}

	export class Include implements Statement {
		file: string;
		virtual: boolean;
		included: Statement;

		constructor(file: string, virtual: boolean) {
			this.file = file;
			this.virtual = virtual;
		}

		preprocess(metadata: Metadata): void {
//			const script = Script.fromFile(this.file, true);
//			this.included = script.ast;
//			this.included.preprocess(metadata);
		}

		execute(context: Context) {
			throw "includes not implemented";
		}

		hoist(): void {
			throw "includes not implemented";
		}
	}

	export enum ExitType {
		Function,
		Sub,
		Property,
		Do,
		For,
	}

	export class Exit implements Statement {
		type: ExitType;

		constructor(type: ExitType) {
			this.type = type;
		}

		preprocess(): void {

		}

		execute(context: Context) {
			throw "exit not implemented";
		}

		hoist(): void {
			throw "exit not implemented";
		}
	}

	export enum OptionType {
		Explicit,
	}

	export class Option implements Statement {
		type: OptionType;
		on: boolean;

		constructor(type: OptionType, on: boolean) {
			this.type = type;
			this.on = on;
		}

		preprocess(): void {

		}

		execute(context: Context) {
			throw "option not implemented";
		}

		hoist(): void {
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

		preprocess(): void {

		}

		execute(context: Context) {
			throw "on error not implemented";
		}

		hoist(): void {
			throw "on error not implemented";
		}
	}

	export class SelectCase implements Statement {
		conditions: Expr[];
		body: Statement;

		constructor(conditions: Expr[], body: Statement) {
			this.conditions = conditions;
			this.body = body;
		}

		preprocess(metadata: Metadata): void {
			this.body.preprocess(metadata);
		}

		hoist(context: Context) {

		}

		execute(context: Context) {

		}
	}

	export class Select implements Statement {
		expr: Expr;
		cases: SelectCase[];

		constructor(expr: Expr, cases: SelectCase[]) {
			this.expr = expr;
			this.cases = cases;
		}

		preprocess(metadata: Metadata): void {
			for (let kase of this.cases) {
				kase.preprocess(metadata);
			}
		}

		execute(context: Context) {
			throw "select not implemented";
		}

		hoist(): void {
			throw "select not implemented";
		}
	}

	export class With implements Statement {
		object: Expr;
		body: Statement;

		constructor(object: Expr, body: Statement) {
			this.object = object;
			this.body = body;
		}

		preprocess(metadata: Metadata): void {
			this.body.preprocess(metadata);
		}

		execute(context: Context) {
			throw "with not implemented";
		}

		hoist(): void {
			throw "with not implemented";
		}
	}

	export class Loop implements Statement {
		condition: Expr;
		body: Statement;
		until: boolean;
		post: boolean;

		constructor(condition: Expr, body: Statement, until: boolean, post: boolean) {
			this.condition = condition;
			this.body = body;
			this.until = until;
			this.post = post;
		}

		preprocess(metadata: Metadata): void {
			this.body.preprocess(metadata);
		}

		execute(context: Context) {
			throw "loop not implemented";
		}

		hoist(): void {
			throw "loop not implemented";
		}
	}

	export enum PropertyType {
		Get, Let, Set
	}

	export class Property implements Statement {
		type: PropertyType;
		func: Function;
		def: boolean;

		constructor(type: PropertyType, func: Function, def: boolean) {
			this.type = type;
			this.func = func;
			this.def = def;
		}

		preprocess(metadata: Metadata): void {
			this.func.preprocess(metadata);
		}

		execute(context: Context) {
			throw "property not implemented";
		}

		hoist(): void {
			throw "property not implemented";
		}
	}
	
	export class For implements Statement {
		from: Expr;
		to: Expr;
		step: Expr;
		id: string;
		body: Statement;

		constructor(from: Expr, to: Expr, step: Expr, id: string, body: Statement) {
			this.from = from;
			this.to = to;
			this.step = step;
			this.id = id;
			this.body = body;
		}

		preprocess(metadata: Metadata): void {
			this.body.preprocess(metadata);
		}

		execute(context: Context) {
			throw "for not implemented";
		}

		hoist(): void {
			throw "for not implemented";
		}
	}
	
	export class ForEach implements Statement {
		id: string;
		obj: Expr;
		body: Statement;

		constructor(id: string, obj: Expr, body: Statement) {
			this.id = id;
			this.obj = obj;
			this.body = body;
		}

		preprocess(metadata: Metadata): void {
			this.body.preprocess(metadata);
		}

		execute(context: Context) {
			throw "for each not implemented";
		}

		hoist(): void {
			throw "for each not implemented";
		}
	}
}
