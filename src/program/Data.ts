import * as util from "util";

// TODO: sort these values out
export const TRUE = -1;
export const FALSE = 0;

export abstract class Value {
	abstract value(): any;
}

export class String extends Value {
	readonly str: string;

	constructor(str: string) {
		super();
		this.str = str;
	}

	value(): string {
		return this.str;
	}

	toString(): string {
		return `"${this.str}"`;
	}
}

export class Number extends Value {
	readonly val: number;

	constructor(val: number) {
		super();
		this.val = val;
	}

	value(): number {
		return this.val;
	}

	toString(): string {
		return `${this.val}`;
	}
}

export class Boolean extends Value {
	readonly val: boolean;

	constructor(val: boolean) {
		super();
		this.val = val;
	}

	value(): number {
		// TODO: correct?
		return this.val ? TRUE : FALSE;
	}

	toString(): string {
		return this.val ? "true" : "false";
	}
}

export class Nothing extends Value {
	value() {
		//throw "'nothing' not implemented";
		return 0;
	}

	toString(): string {
		return "nothing";
	}
}

export class Empty extends Value {
	value() {
		//throw "'empty' not implemented";
		return 0;
	}

	toString(): string {
		return "empty";
	}
}

export class Null extends Value {
	value() {
		throw "'null' not implemented";
	}

	toString(): string {
		return "null";
	}
}
