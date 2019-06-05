import { Script } from "./Script";
import { StringSource } from "parser-monad";
import { ast } from "../program/NewAST";
import * as data from "../program/Data";

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
		new ast.Assignment(new ast.Variable(["x"]), new ast.expr.Literal(new data.Number(123))),
		new ast.If(
			new ast.expr.GreaterThan(
				new ast.Variable(["x"]),
				new ast.expr.Literal(new data.Number(100))
			),
			[
				new ast.FunctionCall(
					new ast.Variable(["response", "write"]),
					[
						new ast.expr.Literal(new data.String("hello!"))
					]
				)
			],
			[]
		),
		new ast.Dim("x", -1)
	]);
});
