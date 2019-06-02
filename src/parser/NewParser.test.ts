import { StringSource, SourcePointer } from "parser-monad";
import { expr, statement, statements, args, identifier, variable, funcCall, assignment, subCall, call, dim, argListArg, argList, func, sub, eol, eof, class_, if_ } from "./NewParser";
import { ast } from "./NewAST";

function src(s: string): SourcePointer {
	return new SourcePointer(new StringSource(s));
}

test("eof", () => {
	const s1 = src("text");
	expect(eof.parse(s1).isJust()).toBeFalsy();

	const s2 = src("");
	expect(eof.parse(s2).isJust()).toBeTruthy();
});

test("eol", () => {
	const s1 = src("text");
	expect(() => eol.parse(s1).isJust()).toThrow();

	const s2 = src("\n  next");
	let [result, rest] = eol.parse(s2).from();
	expect(result).toStrictEqual("\n");
	expect(rest.equals("next"));

	const s3 = src(":  next");
	[result, rest] = eol.parse(s3).from();
	expect(result).toStrictEqual(":");
	expect(rest.equals("next"));

	const s4 = src("");
	[result, rest] = eol.parse(s4).from();
	expect(result).toStrictEqual("");
	expect(rest.equals(""));

	const s5 = src(":  \n :: ");
	[result, rest] = eol.parse(s5).from();
	expect(result).toStrictEqual(":");
	expect(rest.equals(""));
});

describe("expression", () => {
	test("constant", () => {
		const s1 = src("3 + 4 * (-2 - 3) = -17 and 3 < 4");
		const r1 = expr.parse(s1).from()[0];
		expect(r1).toStrictEqual(
			new ast.expr.And(
				new ast.expr.Equal(
					new ast.expr.Add(
						new ast.expr.Number(3),
						new ast.expr.Mul(
							new ast.expr.Number(4),
							new ast.expr.Sub(
								new ast.expr.Number(-2),
								new ast.expr.Number(3),
							)
						)
					),
					new ast.expr.Number(-17)
				),
				new ast.expr.LessThan(
					new ast.expr.Number(3),
					new ast.expr.Number(4)
				)
			)
		);
		expect(r1.value()).toBeTruthy();

		const s2 = src("3 + 4 - (-2 * 3) = 13 and 3 > 4");
		expect(expr.parse(s2).from()[0].value()).toBeFalsy();
	});
});

test("statement", () => {
	const s1 = src("statement");
	expect(statement().parse(s1).from()[0]).toStrictEqual(new ast.DummyStatement);

	const s2 = src("call s (1, 2)");
	expect(statement().parse(s2).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["s"]),
			[new ast.expr.Number(1), new ast.expr.Number(2)]
		)
	);

	// Fun ambiguity - let's see if it works!
	const s3 = src("s (1), 2");
	expect(statement().parse(s3).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["s"]),
			[new ast.expr.Number(1), new ast.expr.Number(2)]
		)
	);

	const s4 = src("dict (1) = 2");
	expect(statement().parse(s4).from()[0]).toStrictEqual(
		new ast.Assignment(
			new ast.FunctionCall(
				new ast.Variable(["dict"]),
				[new ast.expr.Number(1)]
			),
			new ast.expr.Number(2)
		)
	);

	const s5 = src("func (1)");
	expect(statement().parse(s5).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["func"]),
			[new ast.expr.Number(1)]
		)
	);
});

test("statements", () => {
	const s = src("statement \n statement \nstatement : statement");
	expect(statements.parse(s).from()[0]).toStrictEqual([
		new ast.DummyStatement(),
		new ast.DummyStatement(),
		new ast.DummyStatement(),
		new ast.DummyStatement(),
	]);
});

test("args", () => {
	const s1 = src("3");
	const s2 = src("3, 4 + 1, (4+2)*3, 0");
	const s3 = src("0");

	const reference = [
		expr.parse(src("3")).from()[0],
		expr.parse(src("4 + 1")).from()[0],
		expr.parse(src("(4+2)*3")).from()[0],
		expr.parse(src("0")).from()[0],
	];

	expect(args().parse(s1).from()[0]).toEqual([reference[0]]);
	expect(args().parse(s2).from()[0].toString()).toEqual(reference.toString());
	expect(args().parse(s3).from()[0]).toEqual([reference[3]]);

	const s4= src("");
	expect(args().parse(s4).from()[0]).toEqual([]);
});

test("identifier", () => {
	const s1 = src("abc123  ");
	let [result, rest] = identifier.parse(s1).from();
	expect(result).toStrictEqual("abc123");
	expect(rest.equals("")).toBeTruthy();

	const s2 = src("3abc123");
	expect(identifier.parse(s2).isJust()).toBeFalsy();
});

test("variable", () => {
	const s1 = src("first.second.last");
	expect(variable.parse(s1).from()[0]).toStrictEqual(new ast.Variable([
		"first", "second", "last"
	]));

	const s2 = src("var");
	expect(variable.parse(s2).from()[0]).toStrictEqual(new ast.Variable([
		"var"
	]));
});

test("function call", () => {
	const s1 = src("obj.f(1, 2)");
	expect(funcCall.parse(s1).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Variable(["obj", "f"]),
		[new ast.expr.Number(1), new ast.expr.Number(2)]
	));
});

test("assignment", () => {
	const s1 = src("obj.f(1, 2) = 3");
	expect(assignment.parse(s1).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.FunctionCall(
			new ast.Variable(["obj", "f"]),
			[new ast.expr.Number(1), new ast.expr.Number(2)]
		),
		new ast.expr.Number(3)
	));

	const s2 = src("v = 3");
	expect(assignment.parse(s2).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.Variable(["v"]),
		new ast.expr.Number(3),
	));
});

test("sub call", () => {
	const s = src("obj.s (1), 2");

	expect(subCall.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Variable(["obj", "s"]),
		[new ast.expr.Number(1), new ast.expr.Number(2)]
	));
});

test("call", () => {
	const s = src("call obj.s ((1), 2)");

	expect(call.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Variable(["obj", "s"]),
		[new ast.expr.Number(1), new ast.expr.Number(2)]
	));
});

test("dim", () => {
	const s = src("dim hello");

	expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Dim(
		"hello"
	));
});

test("argListArg", () => {
	const s = src("arg1");

	expect(argListArg.parse(s).from()[0]).toStrictEqual(new ast.Argument(
		"arg1"
	));
});

test("argList", () => {
	const s1 = src("arg1, arg2, arg3");

	expect(argList().parse(s1).from()[0]).toStrictEqual([
		new ast.Argument("arg1"),
		new ast.Argument("arg2"),
		new ast.Argument("arg3"),
	]);

	const s2 = src(")");
	let [result, rest] = argList().parse(s2).from();
	expect(result).toStrictEqual([]);
	expect(rest.equals(")")).toBeTruthy();
});

test("function", () => {
	const s = src("function f(a, b)\n\tstatement\n\tstatement\nend function");

	expect(func.parse(s).from()[0]).toStrictEqual(new ast.Function(
		"f",
		[new ast.Argument("a"), new ast.Argument("b")],
		[new ast.DummyStatement, new ast.DummyStatement]
	));
});

test("sub", () => {
	const s1 = src("sub f(a, b)\n\tstatement\n\tstatement\nend sub");

	expect(sub.parse(s1).from()[0]).toStrictEqual(new ast.Function(
		"f",
		[new ast.Argument("a"), new ast.Argument("b")],
		[new ast.DummyStatement, new ast.DummyStatement]
	));

	const s2 = src("sub subroutine\n\tstatement\n\tstatement\nend sub");

	expect(sub.parse(s2).from()[0]).toStrictEqual(new ast.Function(
		"subroutine",
		[],
		[new ast.DummyStatement, new ast.DummyStatement]
	));
});

test("class", () => {
	const s1 = src("class MyClass\n\tdim a\n\tsub test :\t end sub\nend class");

	expect(class_.parse(s1).from()[0]).toStrictEqual(new ast.Class(
		"MyClass",
		[
			new ast.Dim("a"),
			new ast.Function("test", [], [])
		]
	));
});

test("if", () => {
	const s1 = src("if 1 then\nstatement\nelseif 2 then\nelseif 3 then\nelse\nend if");

	expect(if_.parse(s1).from()[0]).toStrictEqual(new ast.If(
		new ast.expr.Number(1),
		[
			new ast.DummyStatement
		],
		[
			new ast.If(
				new ast.expr.Number(2),
				[],
				[
					new ast.If(
						new ast.expr.Number(3),
						[],
						[]
					)
				]
			)
		]
	));
});
