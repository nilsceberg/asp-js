import { Bucket } from "./Stream";
import { BinaryFunction } from "./BinaryOperators";

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
		constructor(bucket: Bucket, name: Variable, args: Variable[], block: Block) {
			super(bucket);
			this.name = name;
			this.args = args;
			this.block = block;
		}

		name: Variable;
		args: Variable[];
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
		constructor(bucket: Bucket, leftHand: Expression, expr: Expression) {
			super(bucket);
			this.variable = leftHand;
			this.expr = expr;
		}

		variable: Expression;
		expr: Expression;
	}

	export class Expression extends Node {
	}

	export class BinaryOperator extends Expression {
		constructor(bucket: Bucket, f: BinaryFunction, left: Expression, right: Expression) {
			super(bucket);
			this.left = left;
			this.right = right;
			this.f = f;
		}

		left: Expression;
		right: Expression;
		f: BinaryFunction;
	}
	export class UnaryOperator extends Expression {
		constructor(bucket: Bucket, f: (a: any) => any, operand: Expression) {
			super(bucket);
			this.operand = operand;
			this.f = f;
		}

		operand: Expression;
		f: (a: any) => any;
	}

	export class Literal extends Expression {
		constructor(bucket: Bucket, value: any) {
			super(bucket);
			this.value = value;
		}

		value: any;
	}

	export class Variable extends Expression {
		constructor(bucket: Bucket, name: string[]) {
			super(bucket);
			this.name = name;
		}

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

	export class If extends Statement {
		constructor(bucket: Bucket, condition: Expression, block: Block, elseBlock: Block) {
			super(bucket);
			this.condition = condition;
			this.block = block;
			this.elseBlock = elseBlock;
		}

		condition: Expression;
		block: Block;
		elseBlock: Block;
	}
}

