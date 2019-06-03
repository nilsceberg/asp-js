export class VBScriptError extends Error {
	code: number;
}

export class CompilationError implements VBScriptError {
	name: string = "VBScript compilation error";
	message: string;
	code: number;

	constructor(message: string, code: number = 0) {
		this.message = message;
		this.code = code;
	}
}

export class RuntimeError implements VBScriptError {
	name: string = "VBScript runtime error";
	message: string;
	code: number;

	constructor(message: string, code: number = 0) {
		this.message = message;
		this.code = code;
	}
}
