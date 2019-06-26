import { ast } from "./NewAST";
import { Context, DictObj, Box, NodeFunc } from "./NewContext";
import * as data from "./Data";
import { Script } from "../runtime/Script";
import * as util from "util";

// These are left here for future reference, but are remnants of the
// old way of modelling member access:

describe("preprocess", () => {
	let stmt: ast.Statement;
	const someExpr = new ast.expr.Literal(new data.Null);

	let metadata: ast.Metadata;

	beforeEach(() => {
		stmt = <any>{
			preprocess: jest.fn()
		};

		metadata = {
			filename: "test.asp",
			include: Script.astFromFile
		};
	})

	test("block", () => {
		new ast.Block([
			stmt,
			stmt
		]).preprocess(metadata);
		expect(stmt.preprocess).toHaveBeenCalledTimes(2);
		expect(stmt.preprocess).toHaveBeenCalledWith(metadata);
	});

	test("if", () => {
		new ast.If(
			someExpr,
			stmt,
			stmt
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
		expect(stmt.preprocess).nthCalledWith(2, metadata);
	});

	test("loop", () => {
		new ast.Loop(
			someExpr,
			stmt,
			false,
			false
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("with", () => {
		new ast.With(
			someExpr,
			stmt
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("function", () => {
		new ast.Function(
			"name",
			[],
			stmt
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("class", () => {
		new ast.Class(
			"name",
			[stmt, stmt]
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
		expect(stmt.preprocess).nthCalledWith(2, metadata);
	});

	test("for", () => {
		new ast.For(
			someExpr,
			someExpr,
			someExpr,
			"i",
			stmt
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("for each", () => {
		new ast.ForEach(
			"x",
			someExpr,
			stmt
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("case", () => {
		new ast.Select(
			someExpr,
			[<ast.SelectCase>stmt]
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("select case", () => {
		new ast.SelectCase(
			[someExpr],
			stmt
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("property", () => {
		new ast.Property(
			ast.PropertyType.Get,
			new ast.Function(
				"prop",
				[],
				stmt
			),
			false
		).preprocess(metadata);
		expect(stmt.preprocess).nthCalledWith(1, metadata);
	});

	test("include", () => {
		metadata.include = jest.fn(() => new ast.Block([stmt, stmt]));

		const script = new ast.Include("functions.asp", false);
		script.preprocess(metadata);

		expect(script.included).toStrictEqual(
			new ast.Block([
				stmt, stmt
			])
		);

		expect(metadata.include).toHaveBeenCalledWith("functions.asp");
		expect(stmt.preprocess).nthCalledWith(1, metadata);
		expect(stmt.preprocess).nthCalledWith(2, metadata);
	});
});

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
	test("hoist: variable is declared", () => {
		const dim = new ast.Dim("myVar", null);
		const context = new Context();
		context.explicit = true;
		dim.hoist(context);
		expect(context.resolve("myVar")).not.toBeNull();
	});
});

describe("const", () => {
	test("hoist: const hou declared", () => {
		const dim = new ast.Const("myVar", new ast.expr.Literal(new data.Number(1337)));
		const context = new Context();

		context.explicit = true;
		dim.hoist(context);

		expect(context.resolve("myVar").get()).toStrictEqual(new data.Number(1337));

	});
});

function mockStatement() {
	return <ast.Statement>{
		execute: jest.fn(),
		hoist: jest.fn(),
		preprocess: jest.fn(),
	};
};

describe("block", () => {
	let block: ast.Block;
	let a: ast.Statement;
	let b: ast.Statement;
	let context: Context;

	beforeEach(() => {
		a = mockStatement();
		b = mockStatement();
		block = new ast.Block([a, b]);
		context = new Context();
	});

	test("hoist: hoists sub-statements (todo: in order)", () => {
		block.hoist(context);

		expect(a.hoist).toHaveBeenCalled();
		expect(b.hoist).toHaveBeenCalled();

		expect(a.execute).not.toHaveBeenCalled();
		expect(b.execute).not.toHaveBeenCalled();
	});

	test("execute: executes sub-statements (todo: in order)", () => {
		block.execute(context);

		expect(a.execute).toHaveBeenCalled();
		expect(b.execute).toHaveBeenCalled();

		expect(a.hoist).not.toHaveBeenCalled();
		expect(b.hoist).not.toHaveBeenCalled();
	});
});
