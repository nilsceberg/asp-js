import { Script } from "./NewInterpreter";
import { StringSource } from "parser-monad";
import { ast } from "../parser/NewAST";
import { Box } from "./NewContext";
import * as util from "util";

describe("script", () => {
	test("parse", () => {
		const script = new Script;
		script.parse(new StringSource(`
		x = 123\n
		if x > 100 then\n
			response.write "hello!"\n
		end if\n
		dim x\n
		`));

		expect(script.ast).toStrictEqual([
			new ast.Assignment(new ast.Variable(["x"]), new ast.expr.Number(123)),
			new ast.If(
				new ast.expr.GreaterThan(
					new ast.Variable(["x"]),
					new ast.expr.Number(100)
				),
				[
					new ast.FunctionCall(
						new ast.Variable(["response", "write"]),
						[
							new ast.expr.String("hello!")
						]
					)
				],
				[]
			),
			new ast.Dim("x", -1)
		]);
	});
});

describe("block", () => {
	test("hoist", () => {
		const script = new Script;
		script.parse(new StringSource(`
		x = 123\n
		if x < 100 then\n
			response.write "hello!"\n
			dim y\n

			function f
			end function
		end if\n
		dim x\n
		`));

		const block = script.getBlock();
		block.context.explicit = true;
		block.hoist();

		expect(block.context.resolve("x")).toStrictEqual(new Box(new ast.expr.Empty));
		expect(block.context.resolve("y")).toStrictEqual(new Box(new ast.expr.Empty));
		expect(block.context.resolve("f")).toStrictEqual(new Box(new ast.Function("f", [], [])));

		console.log(util.inspect(block.context, {
			depth: null,
			colors: true,
			compact: false,
			customInspect: false,
		}));
	});
});
