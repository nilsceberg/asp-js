export class VBScriptError extends Error {
	name: string;
	message: string;
	code: number;

	toString(): string {
		return `${this.name} (${this.code}): ${this.message}`;
	}
}

export class CompilationError extends VBScriptError {
	name: string = "VBScript compilation error";
	message: string;
	code: number;

	constructor(message: string, code: number = 0) {
		super();
		this.message = message;
		this.code = code;
	}
}

export class RuntimeError extends VBScriptError {
	name: string = "VBScript runtime error";
	message: string;
	code: number;

	constructor(message: string, code: number = 0) {
		super();
		this.message = message;
		this.code = code;
	}
}
