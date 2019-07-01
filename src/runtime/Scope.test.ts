import { VBFunc } from "./Scope";
import { StringSource } from "parser-monad";
import { ast } from "../program/NewAST";
import { Box, DictObj, NodeFunc, Context } from "../program/NewContext";
import * as data from "../program/Data";
import { Script } from "./Script";

describe("scope", () => {
	test("dummy", () => {

	});

	test("hoist", () => {
		const script = new Script();
		script.parse(new StringSource(`
		x = 123\n
		if x < 100 then\n
			response.write "hello!"\n
			dim y\n

			function f
			end function
		end if\n
		dim x\n
		`), false);

		script.globalContext.explicit = true;
		script.ast.hoist(script.globalContext);

		expect(script.globalContext.resolve("x")).toStrictEqual(new Box(new data.Empty));
		expect(script.globalContext.resolve("y")).toStrictEqual(new Box(new data.Empty));
		expect(script.globalContext.resolve("f")).toStrictEqual(new Box(
			new VBFunc(new ast.Function("f", [], new ast.Block([])), script.globalContext)));
	});
	
	test("run", () => {
		const globalContext = new Context();

		const responseObject = new DictObj();
		responseObject.fields["write"] = new Box(new NodeFunc(
			([str]) => {
				return new Box(new data.Empty);
			},
			globalContext
		));

		globalContext.declare("response", responseObject);

		const script = new Script(globalContext);
		script.parse(new StringSource(`
		response.write "hello!"\n
		`), false);

		// Todo: this is commented-out because the interpreter isn't implemented yet
		//script.execute();
	});
});

// Remnant of old member access model:

//test("vbscript function", () => {
//	const globalContext = new Context();
//
//	const func = new VBFunc(new ast.Function(
//		"func", [], [
//			new ast.FunctionCall(
//				new ast.Variable(["success"]),
//				[]
//			)
//		]
//	), globalContext);
//
//	const successFn = jest.fn();
//	const success = new NodeFunc(successFn, globalContext);
//
//	globalContext.declare("success", success);
//
//	func.run([]);
//
//	expect(successFn).toHaveBeenCalled();
//});
