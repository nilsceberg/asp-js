import { ast } from "../parser/NewAST";

export class Object extends ast.Value {
	value() {
		return null;
	}
}

export class Box {
	public value: ast.Value;

	constructor(value: ast.Value) {
		this.value = value;
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

	public declare(name) {
		this.definitions[name] = new Box(new ast.expr.Empty);
	}
}
