import { ast } from "./NewAST";
import { Context, DictObj, Box, NodeFunc } from "./NewContext";
import * as data from "./Data";

describe("variable", () => {
	test("scalar", () => {
		const v = new ast.Variable(["v"]);
		const context = new Context();

		context.declare("v", new data.Number(1337));

		const box = v.evaluate(context);
	});

	test("3 levels", () => {
		const context = new Context();

		const topObject = new DictObj();
		const middleObject = new DictObj();
		const bottomValue = new data.Number(1337);
		middleObject.fields["bottom"] = new Box(bottomValue);
		topObject.fields["middle"] = new Box(middleObject);
		context.declare("top", topObject);

		const v = new ast.Variable(["top", "middle", "bottom"]);

		const box = v.evaluate(context);
	
		expect(box.get()).toStrictEqual(new data.Number(1337));
	});
});

test("function call", () => {
	const context = new Context();
	context.declare("arg", new data.Number(1337));
	const f = jest.fn();
	context.declare("f", new NodeFunc(f, context));

	const stmt = new ast.FunctionCall(
		new ast.Variable(["f"]),
		[new ast.Variable(["arg"])]
	);

	stmt.execute(context);

	expect(f).toHaveBeenCalledWith([context.resolve("arg")], context);
});
