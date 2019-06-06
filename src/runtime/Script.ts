import { ast } from "../program/NewAST";
import { Context } from "../program/NewContext";
import { Source, SourcePointer, StringSource } from "parser-monad";
import { script } from "../parser/NewParser";
import { Scope } from "./Scope";
import { readFileSync } from "fs";

export class Script {
	ast: ast.Statement[];
	globalContext: Context;

	constructor(globalContext: Context = new Context()) {
		this.globalContext = globalContext;
	}

	static fromFile(filename: string): Script {
		const contents = readFileSync(filename).toString("utf-8");
		const source = new StringSource(contents);

		const script = new Script();
		script.parse(source);
		return script;
	}

	parse(source: Source) {
		const sourcePointer = new SourcePointer(source);
		let trailer: SourcePointer;
		[this.ast, trailer] = script.parse(sourcePointer).from();
		//console.log(util.inspect(this.ast, {
		//	depth: null,
		//	colors: true,
		//	compact: false,
		//	customInspect: false,
		//}));
	}

	getScope(): Scope {
		return new Scope(this.ast, this.globalContext);
	}

	execute() {
		const root = this.getScope();
		root.run();
	}
}
