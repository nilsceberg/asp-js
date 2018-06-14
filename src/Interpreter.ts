import { ast } from "./AST";
import * as util from "util";

function error(node: ast.Node, message: string) {
	const bucket = node.bucket;
	throw new Error(`runtime error in ${bucket.filename} at line ${bucket.line}, column ${bucket.position}: ${message}`);
}

type Objekt = { [identifier: string]: Box };

export class Box {
	constructor(value: any = null) {
		this.value = value;
	}

	copy(): Box {
		return new Box(this.value);
	}

	value: any;
}

export class Stack {
	constructor(global: any = {}) {
		this.array = [global];
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

	get(variable: ast.Variable): Box {
		let box = this.resolve(variable.name[0]);
		if (box === undefined) {
			error(variable, `undefined variable '${variable.name[0]}'`);
		}

		for (let i=1; i<variable.name.length; ++i) {
			box = box.value[variable.name[i]];
			if (box === undefined) {
				error(variable, `object '${variable.name.slice(0, i).join(".")}' has no member '${variable.name[i]}'`);
			}
		}

		return box;
	}

	define(identifier: string): void {
		this.array[this.array.length - 1][identifier] = new Box();
	}

	/*set(identifier: string[], value: any): void {
		if (identifier.length === 1) {
			this.resolve(identifier[0]) = value;
		}
		else {

		}
	}*/

	private resolve(identifier: string): Box {
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

	private array: { [identifier: string]: Box }[];
}

export interface Context {
	stack: Stack;
	classes: { [identifier: string]: ast.Class };
	explicit: boolean;
}

export class Interpreter {
	constructor(functions: { [identifier: string]: Box } = {}) {
		this.context = {
			stack: new Stack(functions),
			classes: {},
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
			else if (stmt instanceof ast.Class) {
				this.class(stmt);
			}
		}
	}

	private defineFunction(f: ast.Function): void {
		console.log("defining function", f);
		if (this.context.stack.isDefined(f.name.name[0])) {
			error(f, `redefining name '${f.name}'`);
		}

		this.context.stack.define(f.name.name[0]);
		this.context.stack.get(f.name).value = f;
	}

	private assign(assignment: ast.Assignment): void {
		console.log("assigning", util.inspect(assignment, { depth: null, colors: true }));
		// TODO dot notation
		const box = this.evaluateRef(assignment.variable); //this.context.stack.get(assignment.variable);
		if (box instanceof Box) {
			box.value = this.evaluate(assignment.expr);
		}
		else {
			error(assignment, "not an l-value"); }
	}

	private dim(dim: ast.Dim): void {
		console.log("dimming", dim);
		if (this.context.stack.isDefined(dim.name)) {
			error(dim, `dim: variable '${dim.name}' is already defined`);
		}
		this.context.stack.define(dim.name);
	}

	private evaluateRef(expr: ast.Expression): any {
		if (expr instanceof ast.Variable) {
			return this.context.stack.get(expr);
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
		else if (expr instanceof ast.New) {
			return this.new(expr);
		}
	}

	private evaluate(expr: ast.Expression): any {
		const maybeBox = this.evaluateRef(expr);
		if (maybeBox instanceof Box) {
			return maybeBox.value;
		}
		else {
			return maybeBox;
		}
	}

	private new(n: ast.New): any {
		const klass = this.context.classes[n.klass];
		if (klass === undefined) {
			error(n, `undefined class '${n.klass}'`);
		}

		const obj: Objekt = {}

		for (let dim of klass.dims) {
			obj[dim.name] = new Box();
		}
		for (let method of klass.methods) {
			obj[method.name.name[0]] = new Box(method);
		}

		return obj;
	}

	private class(klass: ast.Class): any {
		if (this.context.classes[klass.name] !== undefined) {
			error(klass, `class ${klass.name} already defined`);
		}

		this.context.classes[klass.name] = klass;
	}

	private call(call: ast.Call): any {
		// TODO should function name be variable instead? :O
		const functionName = (<ast.Variable>call.f).name;
		const func = this.evaluate(call.f);
		//		console.log(util.inspect(this.context.stack, {
		//			depth: 3,
		//			colors: true
		//		}));

		if (func === undefined) {
			error(call, `function '${functionName}' not defined`);
		}

		if (!(func instanceof Function || func instanceof ast.Function)) {
			error(call, `type mismatch ('${functionName}' is not a function)`);
		}

		const args = call.args.map((arg, i) => this.evaluate(arg));

		this.context.stack.push();

		let returnValue;
		if (func instanceof ast.Function) {
			console.log("CALL", functionName);

			if (args.length !== func.args.length) {
				error(call, `'${functionName}' expected ${func.args.length} arguments but got ${args.length}`);
			}

			this.context.stack.define(functionName.slice(-1)[0]);

			args.map((arg, i) => {
				this.context.stack.define(func.args[i].name[0]);
				this.context.stack.get(func.args[i]).value = arg;
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

