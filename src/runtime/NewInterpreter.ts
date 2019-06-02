import { Source, SourcePointer } from "parser-monad";
import { script } from "../parser/NewParser";
import * as util from "util";
import { Context } from "./NewContext";
import { ast } from "../parser/NewAST";

export class Block {
	context: Context;
	statements: ast.Statement[];

	hoist() {
	}
}

export class Script {
	parse(source: Source) {
		const sourcePointer = new SourcePointer(source);
		const ast = script.parse(sourcePointer);
		
		console.log(util.inspect(ast, {
			depth: null,
			colors: true,
			compact: false,
			customInspect: false,
		}));
	}
}

export class Interpreter {
}
