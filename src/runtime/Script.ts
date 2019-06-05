import { ast } from "../program/NewAST";
import { Context } from "../program/NewContext";
import { Source, SourcePointer } from "parser-monad";
import { script } from "../parser/NewParser";
import { Scope } from "./Scope";

export class Script {
	ast: ast.Statement[];
	globalContext: Context;

	constructor(globalContext: Context = new Context()) {
		this.globalContext = globalContext;
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
