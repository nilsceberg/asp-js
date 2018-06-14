import { Bucket } from "./Stream";

export namespace namespaces {
	export const Var = Symbol("Var");
	export const Func = Symbol("Func");
	export const Class = Symbol("Class");
};

export namespace ast {
	export class Node {
		constructor(bucket: Bucket) {
			this.bucket = bucket;
			Object.defineProperty(this, "bucket", {
				enumerable: false
			});
		}

		bucket: Bucket;
	}

	export class Block extends Node {
		constructor(bucket: Bucket, statements: Statement[]) {
			super(bucket);
			this.statements = statements;
		}

		statements: Statement[];
	}

	export class Statement extends Node {
	}

	export class Function extends Statement {
		constructor(bucket: Bucket, name: string, args: string[], block: Block) {
			super(bucket);
			this.name = name;
			this.args = args;
			this.block = block;
		}

		name: string;
		args: string[];
		block: Block;
	}

	export class Class extends Statement {
		constructor(bucket: Bucket, name: string, dims: Dim[], methods: Function[]) {
			super(bucket);
			this.name = name;
			this.dims = dims;
			this.methods = methods;
		}

		name: string;
		dims: Dim[];
		methods: Function[];
	}

	export class Dim extends Statement {
		constructor(bucket: Bucket, name: string) {
			super(bucket);
			this.name = name;
		}

		name: string;
	}

	export class Assignment extends Statement {
		constructor(bucket: Bucket, variable: string[], expr: Expression) {
			super(bucket);
			this.variable = variable;
			this.expr = expr;
		}

		variable: string[];
		expr: Expression;
	}

	export class Expression extends Node {
	}

	export class Mul extends Expression {
		constructor(bucket: Bucket, left: Expression, right: Expression) {
			super(bucket);
			this.left = left;
			this.right = right;
		}

		left: Expression;
		right: Expression;
	}

	export class Add extends Expression {
		constructor(bucket: Bucket, left: Expression, right: Expression) {
			super(bucket);
			this.left = left;
			this.right = right;
		}

		left: Expression;
		right: Expression;
	}

	export class Literal extends Expression {
	}

	export class Integer extends Literal {
		constructor(bucket: Bucket, i: number) {
			super(bucket);
			this.i = i;
		}

		i: number;
	}

	export class Variable extends Expression {
		constructor(bucket: Bucket, name: string[], ns: symbol) {
			super(bucket);
			this.name = name;
			this.ns = ns;
		}

		ns: symbol;
		name: string[];
	}

	export class Call extends Expression {
		constructor(bucket: Bucket, f: Expression, args: Expression[]) {
			super(bucket);
			this.f = f;
			this.args = args;
		}

		f: Expression;
		args: Expression[];
	}

	export class New extends Expression {
		constructor(bucket: Bucket, klass: string) {
			super(bucket);
			this.klass = klass;
		}

		klass: string;
	}
}

