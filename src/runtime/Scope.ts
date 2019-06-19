import * as util from "util";
import { Context, Func, Box } from "../program/NewContext";
import { ast } from "../program/NewAST";

export class VBFunc extends Func {
	private declarationContext: Context;
	private definition: ast.Function;

	constructor(definition: ast.Function, declarationContext: Context) {
		super();
		this.definition = definition;
		this.declarationContext = declarationContext;
	}

	run(args: Box[]): Box {
		const localContext = new Context(this.declarationContext);
		this.definition.body.hoist(localContext);
		this.definition.body.execute(localContext);
		return localContext.returnValue;
	}
}
