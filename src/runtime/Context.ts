import { ast } from "../parser/AST";
import { runtimeError as error } from "../util";

export type Objekt = { [identifier: string]: Box };

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

	push(frame = {}) {
		this.array.push(frame);
	}

	pop() {
		this.array.splice(-1);
	}

	isDefined(identifier: string): boolean {
		return this.resolve(identifier) !== undefined;
	}

	isDefinedLocally(identifier: string): boolean {
		return this.resolve(identifier, true) !== undefined;
	}

	get(variable: ast.Variable, functionOnly: boolean = false): Box {
		let box = this.resolve(variable.name[0], false, functionOnly);
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

	private resolve(identifier: string, localOnly: boolean = false, functionOnly: boolean = false): Box {
		const frame = this.array.slice(-1)[0];
		if (frame[identifier] !== undefined || localOnly) {
			const box = frame[identifier];
			// If we're only looking for functions, skip this
			// TODO: this doesn't seem complete?
			if (!functionOnly) {
				return frame[identifier];
			}
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

