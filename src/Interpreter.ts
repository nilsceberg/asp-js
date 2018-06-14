import { ast } from "./Parser";
import * as util from "util";

export class Stack {
	constructor() {
		this.array = [{}];
	}

	push() {
		this.array.push({});
	}

	pop() {
		this.array.splice(-1);
	}

	get(identifier: string[]): any {
		for (let i = this.array.length - 1; i >= 0; --i) {
			if (this.array[i][identifier[0]] !== undefined) {
				return this.array[i][identifier[0]];
			}
		}
		return undefined;
	}

	set(identifier: string, value: any): void {
		this.array[this.array.length - 1][identifier] = value;
	}

	private array: { [identifier: string]: any }[];
}

export interface Context {
	stack: Stack
	functions: { [identifier: string]: ast.Function }
}

export class Interpreter {
	constructor() {
		this.context = {
			stack: new Stack(),
			functions: {}
		};
	}

	run(block: ast.Block): void {
		this.runBlock(block);
		//console.log(util.inspect(this.context, { depth: null, colors: true }));
	}

	private runBlock(block: ast.Block): any {
		console.log(util.inspect(this.context.stack, { depth: null, colors: true }));
		for (let stmt of block.statements) {
			if (stmt instanceof ast.Function) {
				this.defineFunction(stmt);
			}
			else if (stmt instanceof ast.Call) {
				this.call(stmt);
			}
			else if (stmt instanceof ast.Dim) {
				this.dim(stmt);
			}
			else if (stmt instanceof ast.Assignment) {
				this.assign(stmt);
			}
		}
	}

	private defineFunction(f: ast.Function): void {
		console.log("defining function", f);
		this.context.functions[f.name] = f;
	}

	private assign(assignment: ast.Assignment): void {
		console.log("assigning", util.inspect(assignment, { depth: null, colors: true }));
		// TODO dot notation
		this.context.stack.set(assignment.variable[0], this.evaluate(assignment.expr));
	}

	private dim(dim: ast.Dim): void {
		console.log("dimming", dim);
		// TODO not sure about this one
		this.context.stack.set(dim.name, null);
	}

	private evaluate(expr: ast.Expression): any {
		if (expr instanceof ast.Variable) {
			// TODO dot notation
			const value = this.context.stack.get(expr.name);
			if (value === undefined) {
				this.error(expr, `undefined variable '${expr.name}'`);
			}
			return value;
		}
		else if (expr instanceof ast.Integer) {
			return expr.i;
		}
		else if (expr instanceof ast.Add) {
			return this.evaluate(expr.left) + this.evaluate(expr.right);
		}
		else if (expr instanceof ast.Mul) {
			return this.evaluate(expr.left) * this.evaluate(expr.right);
		}
		else if (expr instanceof ast.Call) {
			return this.call(expr);
		}
	}

	private call(call: ast.Call): any {
		// TODO should function name be variable instead? :O
		const functionName = (<ast.Variable>call.f).name;
		const func = this.context.functions[functionName[0]];

		if (func === undefined) {
			this.error(call, `unknown function '${functionName}'`);
		}

		this.context.stack.push();
		call.args.map((arg, i) => {
			this.context.stack.set(func.args[i], this.evaluate(arg));
		});

		console.log("CALL", functionName);
		this.runBlock(func.block);

		const returnValue = this.context.stack.get(functionName);
		console.log("RETURN", returnValue);

		this.context.stack.pop();

		return returnValue;
	}

	private error(node: ast.Node, message: string) {
		const bucket = node.bucket;
		throw new Error(`runtime error in ${bucket.filename} at line ${bucket.line}, column ${bucket.position}: ${message}`);
	}

	private context: Context;
}

