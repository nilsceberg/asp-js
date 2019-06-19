import { expr, statement, block, args, identifier, trivialVariable, assignment, subCall, call, dim, argListArg, argList, func, sub, eol, eof, class_, if_, set, printBlockCharacter, printBlockContent, printBlockContentString, printBlock, scriptAsp, inlinePrint, include, redim, classDecl, isNotKeyword, applications, access } from "./NewParser";
import { ast } from "../program/NewAST";
import * as data from "../program/Data";
import { Value } from "../program/Data";
import { AccessLevel } from "../program/Access";
import { src } from "./Util";

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
		const s = src("dim_ \n   \t\nhello");

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
				new ast.Variable("x"),
				new ast.Access(new ast.Variable("obj"), "myVar")
			)
		)
	});

	test("variable that begins with new", () => {
		const s = src("newThing");
		expect(expr.parse(s).from()[0]).toStrictEqual(
			new ast.Variable("newThing"),
		)
	});

	test("function call", () => {
		const s = src("3 * (obj.f(4, 1) + 2)");
		expect(expr.parse(s).from()[0]).toStrictEqual(
			new ast.expr.Mul(
				new ast.expr.Literal(new data.Number(3)),
				new ast.expr.Add(
					new ast.FunctionCall(
						new ast.Access(new ast.Variable("obj"), "f"),
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
		// check that we can distinguish things like emptyThing from empty
		const s = src('1 + nothing + emptyThing + empty + null + "hello ""world"""');
		const [result, rest] = expr.parse(s).from();
		expect(result).toStrictEqual(
			new ast.expr.Add(
				new ast.expr.Add(
					new ast.expr.Add(
						new ast.expr.Add(
							new ast.expr.Add(
								new ast.expr.Literal(new data.Number(1)),
								new ast.expr.Literal(new data.Nothing)
							),
							new ast.Variable("emptyThing")
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
					new ast.Access(new ast.Variable("ADODB"), "Connection")
				)
			)
		);
	});
	
	test("negatable sub-expression", () => {
		const s = src("-(1 + 1)");
		expect(expr.parse(s).from()[0]).toStrictEqual(
			new ast.expr.Sub(
				new ast.expr.Literal(new data.Number(0)),
				new ast.expr.Add(
					new ast.expr.Literal(new data.Number(1)),
					new ast.expr.Literal(new data.Number(1)),
				)
			)
		);
	});
	
	test("negatable access", () => {
		const s = src("-func()");
		expect(expr.parse(s).from()[0]).toStrictEqual(
			new ast.expr.Sub(
				new ast.expr.Literal(new data.Number(0)),
				new ast.FunctionCall(
					new ast.Variable("func"),
					[],
				)
			)
		);
	});
});

describe("access", () => {
	test("applications", () => {
		const s = src('(1, "hello")(51)()');
		expect(applications(null).parse(s).from()[0]).toStrictEqual(
			new ast.FunctionCall(
				new ast.FunctionCall(
					new ast.FunctionCall(
						null,
						[
							new ast.expr.Literal(new data.Number(1)),
							new ast.expr.Literal(new data.String("hello")),
						]
					),
					[
							new ast.expr.Literal(new data.Number(51)),
					]
				),
				[]
			)
		)
	});
	
	test("simple variable", () => {
		const s = src("myThing");
		expect(access.parse(s).from()[0]).toStrictEqual(
			new ast.Variable("myThing")
		);
	});
	
	test("simple function call", () => {
		const s = src("myFunction(31, 4)");
		expect(access.parse(s).from()[0]).toStrictEqual(
			new ast.FunctionCall(
				new ast.Variable("myFunction"),
				[
					new ast.expr.Literal(new data.Number(31)),
					new ast.expr.Literal(new data.Number(4)),
				]
			)
		);
	});
	
	test("3-level variable", () => {
		const s = src("parent.child.grandChild");
		expect(access.parse(s).from()[0]).toStrictEqual(
			new ast.Access(
				new ast.Access(
					new ast.Variable("parent"),
					"child"
				),
				"grandChild"
			)
		);
	});
	
	test("3-level function", () => {
		const s = src("parent.child.grandChild(1337)");
		expect(access.parse(s).from()[0]).toStrictEqual(
			new ast.FunctionCall(
				new ast.Access(
					new ast.Access(
						new ast.Variable("parent"),
						"child"
					),
					"grandChild"
				),
				[
					new ast.expr.Literal(new data.Number(1337))
				]
			),
		);
	});
	
	test("unqualified", () => {
		// We test with 'end' because keywords should be allowed as right-hand of '.'
		const s = src(".child.grandChild");
		expect(access.parse(s).from()[0]).toStrictEqual(
			new ast.Access(
				new ast.Access(
					null,
					"child"
				),
				"grandChild"
			)
		);
	});
	
	test("initial keyword", () => {
		const s = src("end.child.grandChild");
		expect(access.parse(s).isJust()).toBeFalsy();
	});
	
	test("initial expression", () => {
		// Nonsensical but valid syntax (according to our grammar)
		const s = src("(1 + 2).child");
		expect(access.parse(s).from()[0]).toStrictEqual(
			new ast.Access(
				new ast.expr.Add(
					new ast.expr.Literal(new data.Number(1)),
					new ast.expr.Literal(new data.Number(2)),
				),
				"child"
			)
		);
	});
	
	test("complex", () => {
		const s = src('parent.someDict("key")(1, 2).what.f()');
		expect(access.parse(s).from()[0]).toStrictEqual(
			new ast.FunctionCall(
				new ast.Access(
					new ast.Access(
						new ast.FunctionCall(
							new ast.FunctionCall(
								new ast.Access(
									new ast.Variable("parent"),
									"someDict"
								),
								[
									new ast.expr.Literal(new data.String("key"))
								]
							),
							[
								new ast.expr.Literal(new data.Number(1)),
								new ast.expr.Literal(new data.Number(2)),
							]
						),
						"what"
					),
					"f"
				),
				[]
			)
		);
	});

	//test("identifier component", () => {
	//	// We test with 'end' because this should allow keywords
	//	const s = src("end");
	//	expect(component.parse(s).from()[0]).toStrictEqual(
	//		new ast.Variable_("end")
	//	);
	//});

	//test("expression component", () => {
	//	// We test with 'end' because this should allow keywords
	//	const s = src("(2 + 3)");
	//	expect(component.parse(s).from()[0]).toStrictEqual(
	//		new ast.expr.Add(
	//			new ast.expr.Literal(new data.Number(2)),
	//			new ast.expr.Literal(new data.Number(3)),
	//		)
	//	);
	//});
});

test("statement", () => {
	const s1 = src("statement");
	expect(statement.parse(s1).from()[0]).toStrictEqual(new ast.DummyStatement);

	const s2 = src("call s (1, 2)");
	expect(statement.parse(s2).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable("s"),
			[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
		)
	);

	// Fun ambiguity - let's see if it works!
	const s3 = src("s (1), 2");
	expect(statement.parse(s3).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable("s"),
			[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
		)
	);

	const s4 = src("dict (1, 2) = 2");
	expect(statement.parse(s4).from()[0]).toStrictEqual(
		new ast.Assignment(
			new ast.FunctionCall(
				new ast.Variable("dict"),
				[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
			),
			new ast.expr.Literal(new data.Number(2))
		)
	);

	const s5 = src("func (1)");
	expect(statement.parse(s5).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable("func"),
			[new ast.expr.Literal(new data.Number(1))]
		)
	);

	const s6 = src("%>text<% func (1)");
	expect(statement.parse(s6).from()[0]).toStrictEqual(new ast.Block([
		responseWrite("text")
	]));

	// This is not allowed
	const s7 = src("func (1, 3)");
	expect(() => statement.parse(s7)).toThrow();
});

test("statements", () => {
	const s = src("statement \n statement \nstatement : statement");
	expect(block.parse(s).from()[0]).toStrictEqual(new ast.Block([
		new ast.DummyStatement,
		new ast.DummyStatement,
		new ast.DummyStatement,
		new ast.DummyStatement,
	]));
});

test("keyword case insensitivity", () => {
	const s = src("statement \n STATEMENT \nStateMent : STATEment");
	expect(block.parse(s).from()[0]).toStrictEqual(new ast.Block([
		new ast.DummyStatement,
		new ast.DummyStatement,
		new ast.DummyStatement,
		new ast.DummyStatement,
	]));

	expect(isNotKeyword("For")).toBeFalsy();
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

	const s5 = src("3,,2");
	expect(args().parse(s5).from()[0]).toEqual([
		new ast.expr.Literal(new data.Number(3)),
		null,
		new ast.expr.Literal(new data.Number(2)),
	]);
});

describe("identifier", () => {
	test("alphanumeric", () => {
		const s1 = src("abc123  ");
		let [result, rest] = identifier.parse(s1).from();
		expect(result).toStrictEqual("abc123");
		expect(rest.equals("")).toBeTruthy();
	});

	test("underscore", () => {
		const s = src("PROP_db_location");
		let [result, rest] = identifier.parse(s).from();
		expect(result).toStrictEqual("PROP_db_location");
	})

	test("invalid", () => {
		const s2 = src("3abc123");
		expect(identifier.parse(s2).isJust()).toBeFalsy();
	});
});

describe("trivial variable", () => {
	test("long", () => {
		const s = src("first.second.last");
		expect(trivialVariable.parse(s).from()[0]).toStrictEqual(
			new ast.Access(
				new ast.Access(
					new ast.Variable(
						"first"
					),
					"second",
				),
				"last"
			)
		);
	});

	test("single", () => {
		const s = src("var");
		expect(trivialVariable.parse(s).from()[0]).toStrictEqual(new ast.Variable(
			"var"
		));
	});

	test("empty", () => {
		const s = src("");
		expect(trivialVariable.parse(s).isJust()).toBeFalsy();
	});

	test("unqualified", () => {
		const s = src(".write");
		expect(trivialVariable.parse(s).from()[0]).toStrictEqual(new ast.Access(
			null,
			"write"
		));
	});

	test("keyword", () => {
		const s = src("response.end");
		expect(trivialVariable.parse(s).from()[0]).toStrictEqual(new ast.Access(
			new ast.Variable("response"),
			"end"
		));
	});
});

test("assignment", () => {
	const s1 = src("obj.f(1, 2) = 3");
	expect(assignment.parse(s1).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.FunctionCall(
			new ast.Access(new ast.Variable("obj"), "f"),
			[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
		),
		new ast.expr.Literal(new data.Number(3))
	));

	const s2 = src("v = 3");
	expect(assignment.parse(s2).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.Variable("v"),
		new ast.expr.Literal(new data.Number(3)),
	));
});

test("set", () => {
	const s1 = src("set obj = new MyClass");
	expect(set.parse(s1).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.Variable("obj"),
		new ast.expr.New(new ast.Variable("MyClass"))
	));
});

describe("sub call", () => {
	test("arguments", () => {
		const s = src("obj.s (1), 2");

		expect(statement.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
			new ast.Access(new ast.Variable("obj"), "s"),
			[new ast.expr.Literal(new data.Number(1)), new ast.expr.Literal(new data.Number(2))]
		));
	});

	test("empty parentheses", () => {
		const s = src("someSub ()");

		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.FunctionCall(
				new ast.Variable("someSub"),
				[]
			)
		);
	});

	test("callee expression", () => {
		const s = src("someFunc().s 123");

		expect(statement.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
			new ast.Access(
				new ast.FunctionCall(
					new ast.Variable("someFunc"),
					[]
				),
				"s"
			),
			[new ast.expr.Literal(new data.Number(123))]
		));
	});
});

test("call", () => {
	const s = src("call obj.s ((1), 2)");

	expect(call.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Access(new ast.Variable("obj"), "s"),
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
				new ast.Redim("x", [new ast.expr.Literal(new data.Number(3))], false)
			])
		);
	});

	test("complex", () => {
		const s = src("redim preserve x(3), y(5, 6)")
		expect(redim.parse(s).from()[0]).toStrictEqual(
			new ast.Block([
				new ast.Redim("x", [new ast.expr.Literal(new data.Number(3))], true),
				new ast.Redim("y", [new ast.expr.Literal(new data.Number(5)), new ast.expr.Literal(new data.Number(6))], true),
			])
		);
	});
});

test("const", () => {
	const s = src("const thing = 123");
	expect(statement.parse(s).from()[0]).toStrictEqual(
		new ast.Const("thing", new ast.expr.Literal(new data.Number(123)))
	);
});

describe("argListArg", () => {
	test("simple", () => {
		const s = src("arg1");

		expect(argListArg.parse(s).from()[0]).toStrictEqual(new ast.Argument(
			"arg1", false
		));
	});

	test("byRef", () => {
		const s = src("byRef arg1");

		expect(argListArg.parse(s).from()[0]).toStrictEqual(new ast.Argument(
			"arg1", true
		));
	});

	test("byVal", () => {
		const s = src("byVal arg1");

		expect(argListArg.parse(s).from()[0]).toStrictEqual(new ast.Argument(
			"arg1", false
		));
	});
});

test("argList", () => {
	const s1 = src("arg1, byRef arg2, byVal arg3");

	expect(argList.parse(s1).from()[0]).toStrictEqual([
		new ast.Argument("arg1"),
		new ast.Argument("arg2", true),
		new ast.Argument("arg3"),
	]);

	const s2 = src(")");
	let [result, rest] = argList.parse(s2).from();
	expect(result).toStrictEqual([]);
	expect(rest.equals(")")).toBeTruthy();
});

describe("function", () => {
	test("with args", () => {
		const s = src("function f(a, b)\n\tstatement\n\tstatement\nend function");

		expect(func.parse(s).from()[0]).toStrictEqual(new ast.Function(
			"f",
			[new ast.Argument("a"), new ast.Argument("b")],
			new ast.Block([new ast.DummyStatement, new ast.DummyStatement])
		));
	});

	test("without args", () => {
		const s = src("function f\n\tstatement\n\tstatement\nend function");

		expect(func.parse(s).from()[0]).toStrictEqual(new ast.Function(
			"f",
			[],
			new ast.Block([new ast.DummyStatement, new ast.DummyStatement])
		));
	});

	test("with access modifier", () => {
		const s = src("private function f\n\tstatement\n\tstatement\nend function");

		expect(func.parse(s).from()[0]).toStrictEqual(new ast.Function(
			"f",
			[],
			new ast.Block([new ast.DummyStatement, new ast.DummyStatement]),
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
			new ast.Block([new ast.DummyStatement, new ast.DummyStatement])
		));
	});

	test("without args", () => {
		const s2 = src("sub subroutine\n\tstatement\n\tstatement\nend sub");

		expect(sub.parse(s2).from()[0]).toStrictEqual(new ast.Function(
			"subroutine",
			[],
			new ast.Block([new ast.DummyStatement, new ast.DummyStatement])
		));
	});

	test("with access modifier", () => {
		const s2 = src("private sub subroutine\n\tstatement\n\tstatement\nend sub");

		expect(sub.parse(s2).from()[0]).toStrictEqual(new ast.Function(
			"subroutine",
			[],
			new ast.Block([new ast.DummyStatement, new ast.DummyStatement]),
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
			new ast.Function("test", [], new ast.Block([]))
		]
	));
});

describe("if", () => {
	test("single-line", () => {
		const s = src("if x < y then statement\nstatement");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.If(
				new ast.expr.LessThan(
					new ast.Variable("x"),
					new ast.Variable("y")
				),
				new ast.DummyStatement,
				new ast.Block([])
			)
		)
	});

	test("simple", () => {
		const s = src("if x < y then\nstatement\nend if");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.If(
				new ast.expr.LessThan(
					new ast.Variable("x"),
					new ast.Variable("y")
				),
				new ast.Block([
					new ast.DummyStatement
				]),
				new ast.Block([])
			)
		)
	});

	test("elseif", () => {
		const s1 = src("if 1 then\nstatement\nelseif 2 then\nstatement\nend if");

		expect(statement.parse(s1).from()[0]).toStrictEqual(new ast.If(
			new ast.expr.Literal(new data.Number(1)),
			new ast.Block([
				new ast.DummyStatement
			]),
			new ast.If(
				new ast.expr.Literal(new data.Number(2)),
				new ast.Block([
					new ast.DummyStatement
				]),
				new ast.Block([
				])
			)
		));
	});

	test("elseif, else", () => {
		const s1 = src("if 1 then\nstatement\nelseif 2 then\nelseif 3 then\nelse\nend if");

		expect(statement.parse(s1).from()[0]).toStrictEqual(new ast.If(
			new ast.expr.Literal(new data.Number(1)),
			new ast.Block([
				new ast.DummyStatement
			]),
			new ast.If(
				new ast.expr.Literal(new data.Number(2)),
				new ast.Block([]),
				new ast.If(
					new ast.expr.Literal(new data.Number(3)),
					new ast.Block([]),
					new ast.Block([])
				)
			)
		));
	});
});

describe("properties", () => {
	test("private get", () => {
		const s = src("private property get myProp\nstatement\nend property");
		expect(classDecl.parse(s).from()[0]).toStrictEqual(new ast.Property(
			ast.PropertyType.Get,
			new ast.Function(
				"myProp", [], new ast.Block([new ast.DummyStatement]), AccessLevel.Private
			),
			false
		));
	});

	test("public default get", () => {
		const s = src("public default property get myProp()\nstatement\nend property");
		expect(classDecl.parse(s).from()[0]).toStrictEqual(new ast.Property(
			ast.PropertyType.Get,
			new ast.Function(
				"myProp", [], new ast.Block([new ast.DummyStatement]), AccessLevel.Public
			),
			true
		));
	});

	test("get with index", () => {
		const s = src("property get myProp(index)\nstatement\nend property");
		expect(classDecl.parse(s).from()[0]).toStrictEqual(new ast.Property(
			ast.PropertyType.Get,
			new ast.Function(
				"myProp", [new ast.Argument("index")], new ast.Block([new ast.DummyStatement]), AccessLevel.Public
			),
			false
		));
	});

	test("set", () => {
		const s = src("property set myProp(x)\nstatement\nend property");
		expect(classDecl.parse(s).from()[0]).toStrictEqual(new ast.Property(
			ast.PropertyType.Set,
			new ast.Function(
				"myProp", [new ast.Argument("x")], new ast.Block([new ast.DummyStatement]), AccessLevel.Public
			),
			false
		));
	});

	test("private let", () => {
		const s = src("private property let myProp(x)\nstatement\nend property");
		expect(classDecl.parse(s).from()[0]).toStrictEqual(new ast.Property(
			ast.PropertyType.Let,
			new ast.Function(
				"myProp", [new ast.Argument("x")], new ast.Block([new ast.DummyStatement]), AccessLevel.Private
			),
			false
		));
	}); 
});

describe("loops", () => {
	test("while ... wend", () => {
		const s = src("while 1 + 1\nstatement\nwend");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.Loop(
				new ast.expr.Add(
					new ast.expr.Literal(new data.Number(1)),
					new ast.expr.Literal(new data.Number(1)),
				),
				new ast.Block([new ast.DummyStatement]),
				false,
				false
			)
		);
	});

	test("do while ... loop", () => {
		const s = src("do while 1 + 1\nstatement\nloop");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.Loop(
				new ast.expr.Add(
					new ast.expr.Literal(new data.Number(1)),
					new ast.expr.Literal(new data.Number(1)),
				),
				new ast.Block([new ast.DummyStatement]),
				false,
				false
			)
		);
	});

	test("do until ... loop", () => {
		const s = src("do until 1 + 1\nstatement\nloop");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.Loop(
				new ast.expr.Add(
					new ast.expr.Literal(new data.Number(1)),
					new ast.expr.Literal(new data.Number(1)),
				),
				new ast.Block([new ast.DummyStatement]),
				true,
				false
			)
		);
	});

	test("do ... loop while", () => {
		const s = src("do\nstatement\nloop while 1 + 1");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.Loop(
				new ast.expr.Add(
					new ast.expr.Literal(new data.Number(1)),
					new ast.expr.Literal(new data.Number(1)),
				),
				new ast.Block([new ast.DummyStatement]),
				false,
				true));
			});

	test("do ... loop until", () => {
		const s = src("do\nstatement\nloop until 1 + 1");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.Loop(
				new ast.expr.Add(
					new ast.expr.Literal(new data.Number(1)),
					new ast.expr.Literal(new data.Number(1)),
				),
				new ast.Block([new ast.DummyStatement]),
				true,
				true
			)
		);
	});

	test("do ... loop", () => {
		const s = src("do\nstatement\nloop");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.Loop(
				new ast.expr.Literal(new data.Boolean(true)),
				new ast.Block([new ast.DummyStatement]),
				false,
				false
			)
		);
	});
});

describe("for", () => {
	test("simple", () => {
		const s = src("for i=1 to 3\nstatement\nnext");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.For(
				new ast.expr.Literal(new data.Number(1)),
				new ast.expr.Literal(new data.Number(3)),
				new ast.expr.Literal(new data.Number(1)),
				"i",
				new ast.Block([new ast.DummyStatement])
			)
		);
	});

	test("step", () => {
		const s = src("for i=0 to 6 step 2\nstatement\nnext");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.For(
				new ast.expr.Literal(new data.Number(0)),
				new ast.expr.Literal(new data.Number(6)),
				new ast.expr.Literal(new data.Number(2)),
				"i",
				new ast.Block([new ast.DummyStatement])
			)
		);
	});
});

describe("for each", () => {
	test("simple", () => {
		const s = src("for each x in xs\nstatement\nnext");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.ForEach(
				"x",
				new ast.Variable("xs"),
				new ast.Block([new ast.DummyStatement])
			)
		);
	});
});

describe("options", () => {
	test("implied on", () => {
		expect(statement.parse(src("option explicit")).from()[0]).toStrictEqual(
			new ast.Option(ast.OptionType.Explicit, true)
		);
	});

	test("on", () => {
		expect(statement.parse(src("option explicit on")).from()[0]).toStrictEqual(
			new ast.Option(ast.OptionType.Explicit, true)
		);
	});

	test("off", () => {
		expect(statement.parse(src("option explicit off")).from()[0]).toStrictEqual(
			new ast.Option(ast.OptionType.Explicit, false)
		);
	});
});

describe("on error", () => {
	test("resume next", () => {
		expect(statement.parse(src("on error resume next")).from()[0]).toStrictEqual(
			new ast.OnError(ast.ErrorHandling.ResumeNext)
		);
	});

	test("goto 0", () => {
		expect(statement.parse(src("on error goto 0")).from()[0]).toStrictEqual(
			new ast.OnError(ast.ErrorHandling.Goto0)
		);
	});
});

describe("exit", () => {
	test("function", () => {
		expect(statement.parse(src("exit function")).from()[0]).toStrictEqual(
			new ast.Exit(ast.ExitType.Function)
		);
	});

	test("sub", () => {
		expect(statement.parse(src("exit sub")).from()[0]).toStrictEqual(
			new ast.Exit(ast.ExitType.Sub)
		);
	});

	test("do", () => {
		expect(statement.parse(src("exit do")).from()[0]).toStrictEqual(
			new ast.Exit(ast.ExitType.Do)
		);
	});

	test("for", () => {
		expect(statement.parse(src("exit for")).from()[0]).toStrictEqual(
			new ast.Exit(ast.ExitType.For)
		);
	});

	test("property", () => {
		expect(statement.parse(src("exit property")).from()[0]).toStrictEqual(
			new ast.Exit(ast.ExitType.Property)
		);
	});
});

describe("with", () => {
	test("simple", () => {
		const s = src("with obj\nstatement\nend with");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.With(
				new ast.Variable("obj"),
				new ast.Block([new ast.DummyStatement])
			)
		)
	});
});

describe("select", () => {
	test("simple", () => {
		const s = src("select case val\ncase 4\nstatement\ncase 7, 20\nstatement\ncase else\nstatement\nend select");
		expect(statement.parse(s).from()[0]).toStrictEqual(
			new ast.Select(
				new ast.Variable("val"),
				[
					new ast.SelectCase(
						[
							new ast.expr.Literal(new data.Number(4))
						],
						new ast.Block([new ast.DummyStatement])
					),
					new ast.SelectCase(
						[
							new ast.expr.Literal(new data.Number(7)),
							new ast.expr.Literal(new data.Number(20)),
						],
						new ast.Block([new ast.DummyStatement])
					),
					new ast.SelectCase(null, new ast.Block([new ast.DummyStatement])),
				]
			)
		)
	});
});

function responseWrite(str: string): ast.FunctionCall {
	return new ast.FunctionCall(
		new ast.Access(new ast.Variable("Response"), "Write"),
		[new ast.expr.Literal(new data.String(str))]
	);
}

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
			responseWrite("some literal text' not a comment ")
		);
		expect(rest.equals("<% code"))
	});

	test("printBlockContent", () => {
		const s = src("some literal text' not a comment <% code");

		const [result, rest] = printBlockContent.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			responseWrite("some literal text' not a comment ")
		]));
		expect(rest.equals("<% code"))
	});

	test("inline print", () => {
		const s = src("<% = expr %>rest");

		const [result, rest] = inlinePrint.parse(s).from();

		expect(result).toStrictEqual(
			new ast.FunctionCall(
				new ast.Access(new ast.Variable("Response"), "Write"),
				[new ast.Variable("expr")]
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
				new ast.Access(new ast.Variable("Response"), "Write"),
				[new ast.Variable("stuff")]
			),
			responseWrite("more text"),
			new ast.FunctionCall(
				new ast.Access(new ast.Variable("Response"), "Write"),
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
				new ast.Access(new ast.Variable("Response"), "Write"),
				[new ast.Variable("stuff")]
			),
			responseWrite("more text"),
		]));
		expect(rest.equals(""))
	});
	
	test("printBlock", () => {
		const s = src("%>some text<% code");

		const [result, rest] = printBlock.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			responseWrite("some text")
		]));
		expect(rest.equals("code"))
	});

	test("printBlockEof", () => {
		const s = src("%>some text");

		const [result, rest] = printBlock.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			responseWrite("some text")
		]));
		expect(rest.equals(""))
	});

	test("printBlockNoEol", () => {
		const s = src("%><% statement");

		const [result, rest] = block.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			new ast.Block([
				responseWrite("")
			]),
			new ast.DummyStatement
		]));
		expect(rest.equals(""))
	});

	test("printBlockEol", () => {
		const s = src("%><%\n\r statement");

		const [result, rest] = block.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			new ast.Block([
				responseWrite("")
			]),
			new ast.DummyStatement
		]));
		expect(rest.equals(""));
	});
});

describe("script", () => {
	test("asp", () => {
		const s = src(`header<% doThing : dim x %>footer`);

		const [result, rest] = scriptAsp.parse(s).from();

		expect(result).toStrictEqual(new ast.Block([
			new ast.Block([responseWrite("header")]),
			new ast.FunctionCall(new ast.Variable("doThing"), []),
			new ast.Block([new ast.Dim("x", null)]),
			new ast.Block([responseWrite("footer")]),
		]));
	});
});
