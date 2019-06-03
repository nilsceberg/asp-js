import { Source, SourcePointer } from "parser-monad";
import { script } from "../parser/NewParser";
import * as util from "util";
import { Context, VBFunc } from "./NewContext";
import { ast } from "../parser/NewAST";

export class Scope {
	context: Context;
	statements: ast.Statement[];

	constructor(statements: ast.Statement[], parentContext: Context = null) {
		this.statements = statements;
		this.context = new Context(parentContext);
	}

	hoist(statements: ast.Statement[] = this.statements) {
		for (const statement of statements) {
			if (statement instanceof ast.Dim) {
				this.context.declare(statement.name);
			}
			else if (statement instanceof ast.Function) {
				this.context.declare(statement.name,
					new VBFunc(statement, this.context));
			}
			else if (statement instanceof ast.Class) {
				throw "classes not implemented";
			}
			else {
				this.hoist(statement.subStatements());
			}
		}
	}

	run() {
		this.hoist();
		console.log(util.inspect(this.context, {
			depth: null,
			colors: true,
			compact: false,
			customInspect: false,
		}));

		this.execute(this.statements);
	}

	private execute(statements: ast.Statement[]) {
		for (const statement of statements) {
			console.log("EXECUTING:", util.inspect(statement, {
				depth: null,
				colors: true,
				compact: false,
				customInspect: false,
			}));
		}
	}
}

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

export class Interpreter {
}
