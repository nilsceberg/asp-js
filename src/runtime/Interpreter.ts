import { ast } from "../parser/AST";
import { InputStream } from "../parser/InputStream";
import { TokenStream } from "../parser/TokenStream";
import { Parser } from "../parser/Parser";
import { Objekt, Box, Stack, Context } from "./Context";
import { runtimeError as error } from "../util";

import * as util from "util";


export class Interpreter {
	constructor(functions: { [identifier: string]: Box } = {}) {
		this.context = {
			stack: new Stack(functions),
			classes: {},
			explicit: true,
		};
	}

	load(filename: string): ast.Block {
		const isAsp = filename.split(".").slice(-1)[0] === "asp";
		const input = new InputStream(filename);
		const tokens = new TokenStream(input, isAsp);
		const parser = new Parser(tokens);
		return parser.parse();
	}

	runFile(filename: string): void {
		this.run(this.load(filename));
	}

	run(block: ast.Block): void {
		//console.log(util.inspect(block, { depth: null, colors: true }));
		this.runBlock(block);
		//console.log(util.inspect(this.context, { depth: null, colors: true }));
	}

	private runBlock(block: ast.Block): any {
		// Go through and define functions first
		for (const stmt of block.statements) {
			if (stmt instanceof ast.Function) {
				this.defineFunction(stmt);
			}
			else if (stmt instanceof ast.Dim) {
				this.dim(stmt);
			}
		}

		//console.log(util.inspect(this.context.stack, { depth: null, colors: true }));
		for (let stmt of block.statements) {
			if (stmt instanceof ast.Call) {
				this.call(stmt);
			}
			else if (stmt instanceof ast.Assignment) {
				this.assign(stmt);
			}
			else if (stmt instanceof ast.If) {
				this.if(stmt);
			}
			else if (stmt instanceof ast.Class) {
				this.class(stmt);
			}
		}
	}

	private defineFunction(f: ast.Function): void {
		if (this.context.stack.isDefined(f.name.name[0])) {
			error(f, `redefining name '${f.name.name[0]}'`);
		}

		this.context.stack.define(f.name.name[0]);
		this.context.stack.get(f.name).value = f;
	}

	private assign(assignment: ast.Assignment): void {
		//console.log("assigning", util.inspect(assignment, { depth: null, colors: true }));
		// TODO dot notation
		const box = this.evaluateRef(assignment.variable); //this.context.stack.get(assignment.variable);
		if (box instanceof Box) {
			box.value = this.evaluate(assignment.expr);
		}
		else {
			error(assignment, "not an l-value"); }
	}

	private dim(dim: ast.Dim): void {
		if (this.context.stack.isDefinedLocally(dim.name)) {
			error(dim, `dim: variable '${dim.name}' is already defined`);
		}
		this.context.stack.define(dim.name);
	}

	private evaluateRef(expr: ast.Expression): any {
		if (expr instanceof ast.Variable) {
			return this.context.stack.get(expr);
		}
		else if (expr instanceof ast.Literal) {
			return expr.value;
		}
		else if (expr instanceof ast.BinaryOperator) {
			// Note that this is not lazy - VBScript isn't!
			return expr.f(this.evaluate(expr.left), this.evaluate(expr.right));
		}
		else if (expr instanceof ast.UnaryOperator) {
			return expr.f(this.evaluate(expr.operand));
		}
		else if (expr instanceof ast.Call) {
			return this.call(expr);
		}
		else if (expr instanceof ast.New) {
			return this.new(expr);
		}
	}

	// This function is only resolves variables to functions and not other
	// values, so that 
	private evaluateFunction(expr: ast.Expression): any {
		if (expr instanceof ast.Variable) {
			return this.context.stack.get(expr, true).value;
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
	
	private if(stmt: ast.If): any {
		// TODO: look up actual if conditions
		if (this.evaluate(stmt.condition)) {
			this.runBlock(stmt.block);
		}
		else {
			this.runBlock(stmt.elseBlock);
		}
	}

	private call(call: ast.Call): any {
		// TODO should function name be variable instead? :O
		const functionName = (<ast.Variable>call.f).name;
		const func = this.evaluateFunction(call.f);
		//		console.log(util.inspect(this.context.stack, {
		//			depth: 3,
		//			colors: true
		//		}));

		if (func === undefined) {
			error(call, `function '${functionName}' not defined`);
		}

		// Make sure we've resolved to a function
		if (!(func instanceof Function || func instanceof ast.Function)) {
			error(call, `type mismatch ('${functionName.join(".")}' is not a function)`);
		}

		// Evaluate arguments
		const args = call.args.map((arg, i) => this.evaluate(arg));

		// If we're calling an object method, copy that object into the stack
		// frame
		if (functionName.length > 1) {
			this.context.stack.push(Object.assign({}, this.evaluate(
				new ast.Variable(call.bucket, functionName.slice(0, -1)))));
		}
		else {
			this.context.stack.push();
		}

		let returnValue;
		if (func instanceof ast.Function) {
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
			returnValue = func(this.context, ...args);
		}

		this.context.stack.pop();
		return returnValue;
	}

	private context: Context;
}
