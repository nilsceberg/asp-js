import { ast } from "../parser/NewAST";
import * as util from "util";

export abstract class Expr {
	abstract evaluate(context: Context): Box;

	[util.inspect.custom](depth: number, opts: any): string {
		return this.toString();
	}
}

export abstract class Value extends Expr {
	evaluate(context: Context): Box {
		return new Box(this, true);
	}

	abstract value(): any;
}

export type BoxContent = Value | Func;
export class Box {
	private content: BoxContent;
	private readonly: boolean;

	constructor(value: BoxContent, readonly: boolean = false) {
		this.content = value;
		this.readonly = readonly;
	}

	get(): BoxContent {
		return this.content;
	}

	set(content: BoxContent) {
		if (this.readonly) throw "cannot write to readonly box";
		this.content = content;
	}
}

export class Context {
	public explicit: boolean = false;
	public readonly: boolean = false;

	private parent: Context;
	public returnValue: Box = new Box(new ast.expr.Nothing());
 	private definitions: { [name: string]: Box } = {};

	constructor(parent: Context = null) {
		this.parent = parent;

		if (parent) {
			this.explicit = parent.explicit;
		}
	}

	public resolve(name: string, local: boolean = true): Box {
		if (name in this.definitions) {
			return this.definitions[name];
		}

		if (this.parent) {
			const box = this.parent.resolve(name, false);
			if (box) {
				return box;
			}
		}

		if (local && !this.explicit && !this.readonly) {
			this.declare(name);
			return this.definitions[name];
		}

		return null;
	}

	public local(name: string): Box {
		if (name in this.definitions) {
			return this.definitions[name];
		}

		return null;
	}

	public declare(name: string, content: BoxContent = new ast.expr.Empty) {
		if (this.readonly) throw "attempted to write to readonly context";
		this.definitions[name] = new Box(content, this.readonly);
	}

	public set(name: string, box: Box) {
		if (this.readonly) throw "attempted to write to readonly context";
		this.definitions[name] = box;
	}
}

export abstract class Obj extends Value {
	value(): Obj {
		return this;
	}

	abstract get(name: string): Box;
}

export class VBObj extends Obj {
	private context: Context;

	constructor(context: Context) {
		super();
		this.context = new Context(context);
	}

	get(name: string): Box {
		return this.context.local(name);
	}
}

export class DictObj extends Obj {
	public fields: { [name: string]: Box } = {};

	get(name: string): Box {
		return this.fields[name] || null;
	}

	toString() {
		return util.inspect(this.fields);
	}
}

export abstract class Func {
	abstract run(args: Box[]): Box;
}

export class VBFunc extends Func {
	private declarationContext: Context;
	private definition: ast.Function;

	constructor(definition: ast.Function, declarationContext: Context) {
		super();
		this.definition = definition;
		this.declarationContext = declarationContext;
	}

	run(args: Box[]): Box {
		const context = new Context(this.declarationContext);
		for (const i in args) {
			const name = this.definition.args[i].name;
			context.set(name, args[i]);
		}

		// TODO: do things

		return context.returnValue;
	}
}

export class NodeFunc extends Func {
	private f: (args: Box[], context: Context) => Box;
	private globalContext: Context;

	constructor(f: (args: Box[], context: Context) => Box, globalContext: Context) {
		super();
		this.f = f;
		this.globalContext = globalContext;
	}

	run(args: Box[]): Box {
		return this.f(args, this.globalContext);
	}
}
