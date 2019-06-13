import { StringSource, SourcePointer } from "parser-monad";
import { expr, statement, statements, args, identifier, variable, funcCall, assignment, subCall, call, dim, argListArg, argList, func, sub, eol, eof, class_, if_, set, printBlockCharacter, printBlockContent, printBlockContentString, printBlock, scriptAsp, inlinePrint, include, redim } from "./NewParser";
import { ast } from "../program/NewAST";
import * as data from "../program/Data";
import { Value } from "../program/Data";
import { AccessLevel } from "../program/Access";

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

	const s6 = src("%>");
	[result, rest] = eol.parse(s6).from();
	expect(result).toStrictEqual("%>");
	expect(rest.equals("%>"));
});

describe("line continuation", () => {
	test("dim", () => {
		const s = src("dim_\nhello");

		expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Block([
			new ast.Dim(
				"hello",
				null
			)
		]));
	});
});

describe("expression", () => {
	test("constant", () => {
		const s1 = src("3 + 4 * (-2 - 3) = -17 and 3 < 4");
		const r1 = expr.parse(s1).from()[0];
		expect(r1).toStrictEqual(
			new ast.expr.And(
				new ast.expr.Equal(
					new ast.expr.Add(
						new ast.expr.Literal(new data.Number(3)),
						new ast.expr.Mul(
							new ast.expr.Literal(new data.Number(4)),
							new ast.expr.Sub(
								new ast.expr.Literal(new data.Number(-2)),
								new ast.expr.Literal(new data.Number(3)),
							)
						)
					),
					new ast.expr.Literal(new data.Number(-17))
				),
				new ast.expr.LessThan(
					new ast.expr.Literal(new data.Number(3)),
					new ast.expr.Literal(new data.Number(4))
				)
			)
		);
		expect((<Value>r1.evaluate(null).get()).value()).toBeTruthy();

		const s2 = src("false or true = (3 + 1 = 4 and not 1 = 2)");
		const r2 = expr.parse(s2).from()[0];

		expect(r2).toStrictEqual(
			new ast.expr.Or(
				new ast.expr.Literal(new data.Boolean(false)),
				new ast.expr.Equal(
					new ast.expr.Literal(new data.Boolean(true)),
					new ast.expr.And(
						new ast.expr.Equal(
							new ast.expr.Add(
								new ast.expr.Literal(new data.Number(3)),
								new ast.expr.Literal(new data.Number(1))
							),
							new ast.expr.Literal(new data.Number(4))
						),
						new ast.expr.Not(
							new ast.expr.Equal(
								new ast.expr.Literal(new data.Number(1)),
								new ast.expr.Literal(new data.Number(2))
							)
						)
					)
				)
			)
		);
		expect((<Value>r2.evaluate(null).get()).value()).toBeTruthy();
	});

	test("variable", () => {
		const s = src("x + obj.myVar");
		expect(expr.parse(s).from()[0]).toStrictEqual(
			new ast.expr.Add(
				new ast.Variable(["x"]),
				new ast.Variable(["obj", "myVar"])
			)
		)
	});

	test("function call", () => {
		const s = src("3 * (obj.f(4, 1) + 2)");
		expect(expr.parse(s).from()[0]).toStrictEqual(
			new ast.expr.Mul(
				new ast.expr.Literal(new data.Number(3)),
				new ast.expr.Add(
					new ast.FunctionCall(
						new ast.Variable(["obj", "f"]),
						[
							new ast.expr.Literal(new data.Number(4)),
							new ast.expr.Literal(new data.Number(1))
						]
					),
					new ast.expr.Literal(new data.Number(2)),
				)
			)
		)
	});

	test("literals", () => {
		const s = src('1 + nothing + empty + null + "hello ""world"""');
		const [result, rest] = expr.parse(s).from();
		expect(result).toStrictEqual(
			new ast.expr.Add(
				new ast.expr.Add(
					new ast.expr.Add(
						new ast.expr.Add(
							new ast.expr.Literal(new data.Number(1)),
							new ast.expr.Literal(new data.Nothing)
						),
						new ast.expr.Literal(new data.Empty)
					),
					new ast.expr.Literal(new data.Null)
				),
				new ast.expr.Literal(new data.String('hello "world"'))
			)
		);
	});

	test("new", () => {
		const s = src("3 + new ADODB.Connection");
		expect(expr.parse(s).from()[0]).toStrictEqual(
			new ast.expr.Add(
				new ast.expr.Literal(new data.Number(3)),
				new ast.expr.New(
					new ast.Variable(["ADODB", "Connection"])
				)
			)
		);
	});
});

test("statement", () => {
	const s1 = src("statement");
	expect(statement().parse(s1).from()[0]).toStrictEqual(new ast.DummyStatement);

	const s2 = src("call s (1, 2)");
	expect(statement().parse(s2).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["s"]),
			[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
		)
	);

	// Fun ambiguity - let's see if it works!
	const s3 = src("s (1), 2");
	expect(statement().parse(s3).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["s"]),
			[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
		)
	);

	const s4 = src("dict (1, 2) = 2");
	expect(statement().parse(s4).from()[0]).toStrictEqual(
		new ast.Assignment(
			new ast.FunctionCall(
				new ast.Variable(["dict"]),
				[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
			),
			new ast.expr.Literal(new data.Number(2))
		)
	);

	const s5 = src("func (1)");
	expect(statement().parse(s5).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["func"]),
			[new ast.expr.Literal(new data.Number(1))]
		)
	);

	const s6 = src("%>text<% func (1)");
	expect(statement().parse(s6).from()[0]).toStrictEqual(new ast.Block([
		new ast.FunctionCall(
			new ast.Variable(["Response", "Write"]),
			[new ast.expr.Literal(new data.String("text"))]
		)
	]));

	// This is not allowed
	const s7 = src("func (1, 3)");
	expect(() => statement().parse(s7)).toThrow();
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

test("keyword case insensitivity", () => {
	const s = src("statement \n STATEMENT \nStateMent : STATEment");
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
		[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
	));
});

test("assignment", () => {
	const s1 = src("obj.f(1, 2) = 3");
	expect(assignment.parse(s1).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.FunctionCall(
			new ast.Variable(["obj", "f"]),
			[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
		),
		new ast.expr.Literal(new data.Number(3))
	));

	const s2 = src("v = 3");
	expect(assignment.parse(s2).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.Variable(["v"]),
		new ast.expr.Literal(new data.Number(3)),
	));
});

test("set", () => {
	const s1 = src("set obj = new MyClass");
	expect(set.parse(s1).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.Variable(["obj"]),
		new ast.expr.New(new ast.Variable(["MyClass"]))
	));
});

test("sub call", () => {
	const s = src("obj.s (1), 2");

	expect(subCall.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Variable(["obj", "s"]),
		[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
	));
});

test("call", () => {
	const s = src("call obj.s ((1), 2)");

	expect(call.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Variable(["obj", "s"]),
		[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
	));
});

describe("dim", () => {
	test("scalar", () => {
		const s = src("dim hello");

		expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Block([
			new ast.Dim(
				"hello",
				null,
				AccessLevel.Public,
			)
		]));
	});
	test("array", () => {
		const s = src("dim hello(4, 2)");

		expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Block([
			new ast.Dim(
				"hello",
				[4, 2],
				AccessLevel.Public,
			)
		]));
	});
	test("dimensionless array", () => {
		const s = src("dim hello()");

		expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Block([
			new ast.Dim(
				"hello",
				[],
				AccessLevel.Public,
			)
		]));
	});
	test("multiple", () => {
		const s = src("dim a, b(), c(3)");

		expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Block([
			new ast.Dim(
				"a",
				null,
				AccessLevel.Public,
			),
			new ast.Dim(
				"b",
				[],
				AccessLevel.Public,
			),
			new ast.Dim(
				"c",
				[3],
				AccessLevel.Public,
			),
		]));
	});
	test("private", () => {
		const s = src("private hello(4)");

		expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Block([
			new ast.Dim(
				"hello",
				[4],
				AccessLevel.Private,
			)
		]));
	});
	test("public", () => {
		const s = src("public hello(4)");

		expect(dim.parse(s).from()[0]).toStrictEqual(new ast.Block([
			new ast.Dim(
				"hello",
				[4],
				AccessLevel.Public,
			)
		]));
	});
});

describe("redim", () => {
	test("simple", () => {
		const s = src("redim x(3)")
		expect(redim.parse(s).from()[0]).toStrictEqual(
			new ast.Block([
				new ast.Redim("x", [3], false)
			])
		);
	});

	test("complex", () => {
		const s = src("redim preserve x(3), y(5, 6)")
		expect(redim.parse(s).from()[0]).toStrictEqual(
			new ast.Block([
				new ast.Redim("x", [3], true),
				new ast.Redim("y", [5, 6], true),
			])
		);
	});
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

describe("function", () => {
	test("with args", () => {
		const s = src("function f(a, b)\n\tstatement\n\tstatement\nend function");

		expect(func.parse(s).from()[0]).toStrictEqual(new ast.Function(
			"f",
			[new ast.Argument("a"), new ast.Argument("b")],
			[new ast.DummyStatement, new ast.DummyStatement]
		));
	});

	test("without args", () => {
		const s = src("function f\n\tstatement\n\tstatement\nend function");

		expect(func.parse(s).from()[0]).toStrictEqual(new ast.Function(
			"f",
			[],
			[new ast.DummyStatement, new ast.DummyStatement]
		));
	});

	test("with access modifier", () => {
		const s = src("private function f\n\tstatement\n\tstatement\nend function");

		expect(func.parse(s).from()[0]).toStrictEqual(new ast.Function(
			"f",
			[],
			[new ast.DummyStatement, new ast.DummyStatement],
			AccessLevel.Private
		));
	});
});

describe("sub", () => {
	test("with args", () => {
		const s1 = src("sub f(a, b)\n\tstatement\n\tstatement\nend sub");

		expect(sub.parse(s1).from()[0]).toStrictEqual(new ast.Function(
			"f",
			[new ast.Argument("a"), new ast.Argument("b")],
			[new ast.DummyStatement, new ast.DummyStatement]
		));
	});

	test("without args", () => {
		const s2 = src("sub subroutine\n\tstatement\n\tstatement\nend sub");

		expect(sub.parse(s2).from()[0]).toStrictEqual(new ast.Function(
			"subroutine",
			[],
			[new ast.DummyStatement, new ast.DummyStatement]
		));
	});

	test("with access modifier", () => {
		const s2 = src("private sub subroutine\n\tstatement\n\tstatement\nend sub");

		expect(sub.parse(s2).from()[0]).toStrictEqual(new ast.Function(
			"subroutine",
			[],
			[new ast.DummyStatement, new ast.DummyStatement],
			AccessLevel.Private
		));
	});
});

test("class", () => {
	const s1 = src("class MyClass\n\tdim a\n\tsub test :\t end sub\nend class");

	expect(class_.parse(s1).from()[0]).toStrictEqual(new ast.Class(
		"MyClass",
		[
			new ast.Block([
				new ast.Dim("a", null),
			]),
			new ast.Function("test", [], [])
		]
	));
});

describe("if", () => {
	test("simple", () => {
		const s = src("if x < y then\nstatement\nend if");
		expect(if_.parse(s).from()[0]).toStrictEqual(
			new ast.If(
				new ast.expr.LessThan(
					new ast.Variable(["x"]),
					new ast.Variable(["y"])
				),
				[
					new ast.DummyStatement
				],
				[]
			)
		)
	});

	test("elseif, else", () => {
		const s1 = src("if 1 then\nstatement\nelseif 2 then\nelseif 3 then\nelse\nend if");

		expect(if_.parse(s1).from()[0]).toStrictEqual(new ast.If(
			new ast.expr.Literal(new data.Number(1)),
			[
				new ast.DummyStatement
			],
			[
				new ast.If(
					new ast.expr.Literal(new data.Number(2)),
					[],
					[
						new ast.If(
							new ast.expr.Literal(new data.Number(3)),
							[],
							[]
						)
					]
				)
			]
		));
	});
});
	
describe("include", () => {
	test("file", () => {
		const s = src('<!-- #include file="something.asp" -->');
		const [result, rest] = include.parse(s).from();
		expect(result).toStrictEqual(
			new ast.Include("something.asp", false)
		);
		expect(rest.equals("")).toBeTruthy();
	});

	test("virtual", () => {
		const s = src('<!-- #include virtual="something.asp" -->');
		const [result, rest] = include.parse(s).from();
		expect(result).toStrictEqual(
			new ast.Include("something.asp", true)
		);
		expect(rest.equals("")).toBeTruthy();
	});
});


describe("literal print", () => {
	test("printBlockCharacter", () => {
		const s1 = src("a<%");

		let [result, rest] = printBlockCharacter.parse(s1).from();

		expect(result).toStrictEqual("a");
		expect(rest.equals("<%"))
	});
	
	test("printBlockContentString", () => {
		const s = src("some literal text' not a comment <% code");

		const [result, rest] = printBlockContentString.parse(s).from();

		expect(result).toStrictEqual(
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.expr.Literal(new data.String("some literal text' not a comment "))]
			)
		);
		expect(rest.equals("<% code"))
	});

	test("printBlockContent", () => {
		const s = src("some literal text' not a comment <% code");

		const [result, rest] = printBlockContent.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.expr.Literal(new data.String("some literal text' not a comment "))]
			)
		]));
		expect(rest.equals("<% code"))
	});

	test("inline print", () => {
		const s = src("<%= expr %>rest");

		const [result, rest] = inlinePrint.parse(s).from();

		expect(result).toStrictEqual(
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.Variable(["expr"])]
			)
		);

		expect(rest.equals("rest")).toBeTruthy();
	});

	test("printBlockContent with inline print", () => {
		const s = src("text <%= stuff %>more text<%= 4+3 %>even more<% code");

		const [result, rest] = printBlockContent.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			responseWrite("text "),
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.Variable(["stuff"])]
			),
			responseWrite("more text"),
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.expr.Add(
					new ast.expr.Literal(new data.Number(4)),
					new ast.expr.Literal(new data.Number(3)),
				)]
			),
			responseWrite("even more")
		]));
		expect(rest.equals("<% code"))
	});

	test("printBlockContent with include", () => {
		const s = src('text <!-- #include file="something.asp" --><%= stuff %>more text');

		const [result, rest] = printBlockContent.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			responseWrite("text "),
			new ast.Include("something.asp", false),
			responseWrite(""),
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.Variable(["stuff"])]
			),
			responseWrite("more text"),
		]));
		expect(rest.equals(""))
	});
	
	test("printBlock", () => {
		const s = src("%>some text<% code");

		const [result, rest] = printBlock.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.expr.Literal(new data.String("some text"))]
			)
		]));
		expect(rest.equals("code"))
	});

	test("printBlockEof", () => {
		const s = src("%>some text");

		const [result, rest] = printBlock.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			new ast.FunctionCall(
				new ast.Variable(["Response", "Write"]),
				[new ast.expr.Literal(new data.String("some text"))]
			)
		]));
		expect(rest.equals(""))
	});

	test("printBlockNoEol", () => {
		const s = src("%><% statement");

		const [result, rest] = statements.parse(s).from();

		expect(result).toStrictEqual([
			new ast.Block([
				new ast.FunctionCall(
					new ast.Variable(["Response", "Write"]),
					[new ast.expr.Literal(new data.String(""))]
				),
			]),
			new ast.DummyStatement
		]);
		expect(rest.equals(""))
	});

	test("printBlockEol", () => {
		const s = src("%><%\n\r statement");

		const [result, rest] = statements.parse(s).from();

		expect(result).toStrictEqual([
			new ast.Block([
				new ast.FunctionCall(
					new ast.Variable(["Response", "Write"]),
					[new ast.expr.Literal(new data.String(""))]
				),
			]),
			new ast.DummyStatement
		]);
		expect(rest.equals(""));
	});
});

function responseWrite(str: string): ast.FunctionCall {
	return new ast.FunctionCall(
		new ast.Variable(["Response", "Write"]),
		[new ast.expr.Literal(new data.String(str))]
	);
}

describe("script", () => {
	test("asp", () => {
		const s = src(`header<% doThing : dim x %>footer`);

		const [result, rest] = scriptAsp.parse(s).from();

		expect(result).toStrictEqual([
			new ast.Block([responseWrite("header")]),
			new ast.FunctionCall(new ast.Variable(["doThing"]), []),
			new ast.Block([new ast.Dim("x", null)]),
			new ast.Block([responseWrite("footer")]),
		]);
	});
});
