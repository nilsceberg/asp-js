import { ast } from "../program/NewAST";
import { Context } from "../program/NewContext";
import { Source, SourcePointer, StringSource } from "parser-monad";
import { script, scriptAsp } from "../parser/NewParser";
import { readFileSync } from "fs";

export class Script {
	ast: ast.Block;
	globalContext: Context;

	constructor(globalContext: Context = new Context()) {
		this.globalContext = globalContext;
	}

	static fromFile(filename: string, asp: boolean = true, globalContext: Context = new Context()): Script {
		const contents = readFileSync(filename).toString("utf-8");
		const source = new StringSource(contents);

		const script = new Script(globalContext);
		script.parse(source, asp, filename);
		return script;
	}

	static astFromFile(filename: string, asp: boolean = true): ast.Statement {
		const script = Script.fromFile(filename, asp);
		return script.ast;
	}

	parse(source: Source, asp: boolean, filename: string = null) {
		const sourcePointer = new SourcePointer(source);
		let trailer: SourcePointer;

		const parser = asp ? scriptAsp : script;
		[this.ast, trailer] = parser.parse(sourcePointer).from();

		this.ast.preprocess({
			filename: filename,
			include: Script.astFromFile,
		});
		//console.log(util.inspect(this.ast, {
		//	depth: null,
		//	colors: true,
		//	compact: false,
		//	customInspect: false,
		//}));
	}

	execute() {
		this.ast.hoist(this.globalContext);
		this.ast.execute(this.globalContext);
	}
}
