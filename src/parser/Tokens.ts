export namespace tokens {
	export abstract class Token {
		constructor(value: any) {
			this.value = value;
		}
		value: any;

		toString(): string {
			return `'${this.value}'`;
		}

		compare(type: Function, value: any): boolean {
			return this instanceof type && this.value === value;
		}
	};

	export class Identifier extends Token {
		constructor(name: string) {
			super(name);
		}
	}

	export class String extends Token {
		constructor(value: string) {
			super(value);
		}

		toString(): string {
			return `string literal "${this.value}"`;
		}
	}

	export class Integer extends Token {
		constructor(value: number) {
			super(value);
		}

		toString(): string {
			return `integer literal "${this.value}"`;
		}
	}

	export class Inline extends Token {
		constructor(value: string) {
			super(value);
		}
	}

	export class Punctuation extends Token {
		constructor(value: string) {
			super(value);
		}
	}
}

