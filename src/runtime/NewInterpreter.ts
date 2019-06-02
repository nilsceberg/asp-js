import { Source, SourcePointer } from "parser-monad";
import { script } from "../parser/NewParser";
import * as util from "util";
import { Context } from "./NewContext";
import { ast } from "../parser/NewAST";

export class Block {
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
				this.context.declare(statement.name);
				this.context.resolve(statement.name).content = statement;
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
	}
}

export class Script {
	ast: ast.Statement[];

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

	getBlock(): Block {
		return new Block(this.ast);
	}

	execute() {
		const root = this.getBlock();
		root.run();
	}
}

export class Interpreter {
}
