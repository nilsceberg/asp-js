import { ast } from "./Parser";
import * as util from "util";

function error(node: ast.Node, message: string) {
	const bucket = node.bucket;
	throw new Error(`runtime error in ${bucket.filename} at line ${bucket.line}, column ${bucket.position}: ${message}`);
}

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

	isDefined(identifier: string): boolean {
		return this.resolve(identifier) !== undefined;
	}

	get(variable: ast.Variable): any {
		const value = this.resolve(variable.name[0]);
		if (value === undefined) {
			error(variable, `undefined variable '${variable.name}'`);
		}
		return value;
	}

	set(identifier: string, value: any): void {
		this.array[this.array.length - 1][identifier] = value;
	}

	private resolve(identifier: string): any {
		const frame = this.array.slice(-1)[0];
		if (frame[identifier] !== undefined) {
			return frame[identifier];
		}

		const global = this.array[0];
		if (global[identifier] !== undefined) {
			return global[identifier];
		}

		return undefined;
	}

	private array: { [identifier: string]: any }[];
}

export interface Context {
	stack: Stack
	functions: { [identifier: string]: ast.Function | Function }
	explicit: boolean
}

export class Interpreter {
	constructor(functions: { [identifier: string]: Function } = {}) {
		this.context = {
			stack: new Stack(),
			functions: functions,
			explicit: true,
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
		if (!this.context.stack.isDefined(assignment.variable[0])) {
			error(assignment, `assignment: undefined variable '${assignment.variable}'`);
		}
		this.context.stack.set(assignment.variable[0], this.evaluate(assignment.expr));
	}

	private dim(dim: ast.Dim): void {
		console.log("dimming", dim);
		if (this.context.stack.isDefined(dim.name)) {
			error(dim, `dim: variable '${dim.name}' is already defined`);
		}
		this.context.stack.set(dim.name, null);
	}

	private evaluate(expr: ast.Expression): any {
		if (expr instanceof ast.Variable) {
			// TODO dot notation
			const value = this.context.stack.get(expr);
			if (value === undefined) {
				error(expr, `undefined variable '${expr.name}'`);
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
			error(call, `unknown function '${functionName}'`);
		}

		const args = call.args.map((arg, i) => this.evaluate(arg));

		this.context.stack.push();

		let returnValue;
		if (func instanceof ast.Function) {
			console.log("CALL", functionName);

			if (args.length !== func.args.length) {
				error(call, `'${functionName}' expected ${func.args.length} arguments but got ${args.length}`);
			}

			this.context.stack.set(functionName.slice(-1)[0], null);

			args.map((arg, i) => {
				this.context.stack.set(func.args[i], arg);
			});

			this.runBlock(func.block);

			returnValue = this.context.stack.get(<ast.Variable>call.f);
		}
		else if (func instanceof Function) {
			console.log("CALL (JavaScript)", functionName);
			returnValue = func(this.context, ...args);
		}

		console.log("RETURN", returnValue);
		this.context.stack.pop();
		return returnValue;
	}

	private context: Context;
}

