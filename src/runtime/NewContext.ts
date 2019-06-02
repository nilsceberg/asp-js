import { ast } from "../parser/NewAST";

export class Obj extends ast.Value {
	value(): any {
		return null;
	}
}

export type BoxContent = ast.Value | ast.Function;
export class Box {
	public content: BoxContent;

	constructor(value: BoxContent) {
		this.content = value;
	}
}

export class Context {
	public explicit: boolean = false;

	private parent: Context;
	public returnValue: Box = new Box(new ast.expr.Nothing());
 	private definitions: { [name: string]: Box } = {};

	constructor(parent: Context = null) {
		this.parent = parent;

		if (parent) {
			this.explicit = parent.explicit;
		}
	}

	public resolve(name: string): Box {
		if (name in this.definitions) {
			return this.definitions[name];
		}
		else if (this.parent) {
			return this.parent.resolve(name);
		}
		else if (!this.explicit) {
			this.declare(name);
			return this.definitions[name];
		}
		else {
			return null;
		}
	}

	public declare(name: string) {
		this.definitions[name] = new Box(new ast.expr.Empty);
	}
}
