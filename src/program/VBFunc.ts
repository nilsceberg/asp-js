import { Func, Context, Box } from "../runtime/NewContext";
import { ast } from "./NewAST";


export class VBFunc extends Func {
	private declarationContext: Context;
	private definition: ast.Function;

	constructor(definition: ast.Function, declarationContext: Context) {
		super();
		this.definition = definition;
		this.declarationContext = declarationContext;
	}

	run(args: Box[]): Box {
		const context = new Context(this.declarationContext);
		for (const i in args) {
			const name = this.definition.args[i].name;
			context.set(name, args[i]);
		}

		// TODO: do things

		return context.returnValue;
	}
}
