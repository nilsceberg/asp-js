import { ast } from "./NewAST";
import { Context, DictObj, Box, NodeFunc } from "./NewContext";
import * as data from "./Data";

// These are left here for future reference, but are remnants of the
// old way of modelling member access:

describe("variable", () => {
	test("scalar", () => {
		const v = new ast.Variable("v");
		const context = new Context();

		context.declare("v", new data.Number(1337));

		const box = v.evaluate(context);
		expect(box.get().value()).toEqual(1337);
	});
});

describe("access", () => {
	test("3 levels", () => {
		const context = new Context();

		const topObject = new DictObj();
		const middleObject = new DictObj();
		const bottomValue = new data.Number(1337);
		middleObject.fields["bottom"] = new Box(bottomValue);
		topObject.fields["middle"] = new Box(middleObject);
		context.declare("top", topObject);

		const v = new ast.Access(new ast.Access(new ast.Variable("top"), "middle"), "bottom");

		const box = v.evaluate(context);
	
		expect(box.get()).toStrictEqual(new data.Number(1337));
	});
});

test("function call", () => {
	const context = new Context();
	context.declare("arg", new data.Number(1337));
	const f = jest.fn();
	context.declare("f", new NodeFunc(f, context));

	const expression = new ast.FunctionCall(
		new ast.Variable("f"),
		[new ast.Variable("arg")]
	);

	expression.execute(context);

	expect(f).toHaveBeenCalledWith([context.resolve("arg")], context);
});

describe("assignment", () => {
	test("to simple variable", () => {
		const v = new ast.Variable("v");
		const context = new Context();
		context.declare("v", new data.Number(1337));

		const statement = new ast.Assignment(
			new ast.Variable("v"),
			new ast.expr.Literal(new data.Number(500))
		);

		statement.execute(context);
		
		expect(v.evaluate(context).get()).toStrictEqual(new data.Number(500));
	});
});

describe("dim", () => {
	test("variable is declared", () => {
		const dim = new ast.Dim("myVar", null);
		const context = new Context();
		context.explicit = true;
		dim.hoist(context);
		expect(() => context.resolve("myVar")).not.toBeNull();

	});
});
