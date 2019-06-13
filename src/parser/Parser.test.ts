import { StringInputStream } from "./StringInputStream";
import { TokenStream } from "./TokenStream";
import { Parser } from "./Parser";
import { ast } from "./AST";
import { tokens } from "./Tokens";

function parser(code: string, mocks: any = {}): Parser {
	const parser = new Parser(new TokenStream(new StringInputStream(code, "<test>")));
	for (const mock in mocks) {
		(<any>parser)[mock] = mocks[mock];
	}
	return parser;
}

const BUCKET = expect.anything();
const BLOCK = new ast.Block(BUCKET, []);

test("parse function", () => {
	const argList = jest.fn(function() {
		expect(this.tokens.next().content).toStrictEqual(new tokens.Identifier("__arglist__"));
		return [];
	});

	expect(parser(
		`function myFunc(__arglist__)\nend function`,
		{ argList }
	).function())
		.toStrictEqual(new ast.Function(
			BUCKET,
			new ast.Variable(BUCKET, ["myfunc"]),
			[],
			new ast.Block(BUCKET, [])
		));

	expect(argList).toHaveBeenCalled();
});

test("parse class", () => {
	const dim = jest.fn(function() {
		expect(this.tokens.next().content).toStrictEqual(new tokens.Identifier("dim"));
		expect(this.tokens.next().content).toStrictEqual(new tokens.Identifier("__member__"));
		return new ast.Dim(BUCKET, "member");
	});
	const func = jest.fn(function() {
		expect(this.tokens.next().content).toStrictEqual(new tokens.Identifier("function"));
		expect(this.tokens.next().content).toStrictEqual(new tokens.Identifier("__func__"));
		return new ast.Function(
			BUCKET,
			new ast.Variable(BUCKET, ["func"]),
			[],
			new ast.Block(BUCKET, []),
		);
	});

	expect(parser(
		`class MyClass
			dim __member__
			function __func__
		end class`,
		{ dim, function: func }
	).klass())
		.toStrictEqual(new ast.Class(
			BUCKET,
			"myclass",
			[ new ast.Dim(BUCKET, "member") ],
			[ new ast.Function(
				BUCKET,
				new ast.Variable(BUCKET, ["func"]),
				[],
				new ast.Block(BUCKET, [])
			) ]
		));

	expect(dim).toHaveBeenCalledTimes(1);
	expect(func).toHaveBeenCalledTimes(1);
});

test("parse if", () => {
	const expression = jest.fn(function() {
		expect(this.tokens.next().content).toStrictEqual(new tokens.Identifier("__condition__"));
		return new ast.Literal(BUCKET, 0);
	});

	expect(parser(
		`if __condition__ then
		elseif __condition__ then
		else
		end if`,
		{ expression }
	).if()).toStrictEqual(
		new ast.If(
			BUCKET,
			new ast.Literal(BUCKET, 0),
			BLOCK,
			new ast.Block(
				BUCKET,
				[new ast.If(
					BUCKET,
					new ast.Literal(BUCKET, 0),
					BLOCK,
					BLOCK
				)]
			)
		)
	);

	expect(expression).toHaveBeenCalledTimes(2);
});

test("parse argList", () => {
	const argument = jest.fn(function() {
		return new ast.Argument(BUCKET, this.tokens.next().content.value);
	});

	expect(parser(
		`__arg1__, __arg2__, __arg3__)`,
		{ argument }
	).argList()).toStrictEqual(
		[
			new ast.Argument(BUCKET, "__arg1__"),
			new ast.Argument(BUCKET, "__arg2__",),
			new ast.Argument(BUCKET, "__arg3__")
		]
	);

	expect(argument).toHaveBeenCalledTimes(3);
});

describe("parse argument", () => {
	test("default", () => {
		expect(parser(
			`argname,`,
		).argument()).toStrictEqual(
			new ast.Argument(BUCKET, "argname", false),
		);
	});

	test("byVal", () => {
		expect(parser(
			`byval argname,`,
		).argument()).toStrictEqual(
			new ast.Argument(BUCKET, "argname", false),
		);
	});

	test("byRef", () => {
		expect(parser(
			`byref argname,`,
		).argument()).toStrictEqual(
			new ast.Argument(BUCKET, "argname", true),
		);
	});
});

test("parse variable", () => {
	expect(parser(
		`_some_thing123.some_thing_other_._last`
	).variable()).toStrictEqual(
		new ast.Variable(BUCKET, ["_some_thing123", "some_thing_other_", "_last"])
	);
});

test("parse dim", () => {
	expect(parser(`dim myVar`).dim())
		.toStrictEqual(new ast.Dim(BUCKET, "myvar"));
});

/* this should be rewritten with mocks; at the moment it depends heavily
 * on other methods */
describe("parse assignmentOrSubCall", () => {
	test("assignment", () => {
		expect(parser(
			`simple.assignment = 123`
		).assignmentOrSubCall()).toStrictEqual(
			new ast.Assignment(
				BUCKET,
				new ast.Variable(BUCKET, ["simple", "assignment"]),
				new ast.Literal(BUCKET, 123)
			)
		);
	});

	test("assignment with left hand function call", () => {
		expect(parser(
			`func.assignment(1, 2) = 123`
		).assignmentOrSubCall()).toStrictEqual(
			new ast.Assignment(
				BUCKET,
				new ast.Call(
					BUCKET,
					new ast.Variable(BUCKET, ["func", "assignment"]),
					[new ast.Literal(BUCKET, 1), new ast.Literal(BUCKET, 2)]
				),
				new ast.Literal(BUCKET, 123)
			)
		);
	});

	test("sub call with single parenthesized argument", () => {
		expect(parser(
			`sub.name (123)`
		).assignmentOrSubCall()).toStrictEqual(
			new ast.Call(
				BUCKET,
				new ast.Variable(BUCKET, ["sub", "name"]),
				[new ast.Parenthesis(BUCKET, new ast.Literal(BUCKET, 123))]
			)
		);
	});

	test("sub call with multiple parenthesized arguments", () => {
		expect(parser(
			`sub.name (123), (99)`
		).assignmentOrSubCall()).toStrictEqual(
			new ast.Call(
				BUCKET,
				new ast.Variable(BUCKET, ["sub", "name"]),
				[
					new ast.Parenthesis(BUCKET, new ast.Literal(BUCKET, 123)),
					new ast.Parenthesis(BUCKET, new ast.Literal(BUCKET, 99))
				]
			)
		);
	});
});

test("parse new", () => {
	expect(parser(
		`new TestClass`
	).new()).toStrictEqual(
		new ast.New(BUCKET, "testclass")
	);
});

test("parse call", () => {
	const args = jest.fn(function() {
		return [new ast.Literal(BUCKET, this.require(tokens.Identifier).content.value)];
	});

	expect(parser(
		`(__args__)`,
		{ args }
	).call(new ast.Variable(BUCKET, ["testfunc"]))).toStrictEqual(
		new ast.Call(
			BUCKET,
			new ast.Variable(BUCKET, ["testfunc"]),
			[new ast.Literal(BUCKET, "__args__")],
		)
	);
});

test("parse subCall", () => {
	const args = jest.fn(function() {
		return [new ast.Literal(BUCKET, this.require(tokens.Identifier).content.value)];
	});

	expect(parser(
		`__args__`,
		{ args }
	).subCall(new ast.Variable(BUCKET, ["testfunc"]))).toStrictEqual(
		new ast.Call(
			BUCKET,
			new ast.Variable(BUCKET, ["testfunc"]),
			[new ast.Literal(BUCKET, "__args__")],
		)
	);
});

test("parse args", () => {
	const expression = jest.fn(function() {
		return new ast.Literal(BUCKET, this.require(tokens.Identifier).content.value);
	});

	expect(parser(
		`__arg1__, __arg2__`,
		{ expression }
	).args()).toStrictEqual(
		[
			new ast.Literal(BUCKET, "__arg1__"),
			new ast.Literal(BUCKET, "__arg2__"),
		]
	)
});

describe("parse factor", () => {
	const new_ = jest.fn(function() {
		this.expect("new", tokens.Identifier);
		return new ast.New(BUCKET, this.require(tokens.Identifier).content.value);
	});

	const variable = jest.fn(function() {
		return new ast.Variable(BUCKET, [this.require(tokens.Identifier).content.value]);
	});

	const expression = jest.fn(function() {
		return new ast.Literal(BUCKET, this.require(tokens.Identifier).content.value);
	});

	const call = jest.fn(function(f: ast.Expression) {
		return new ast.Call(BUCKET, f, []);
	});

	test("literal", () => {
		expect(parser(
			`12345`,
			{}
		).factor()).toStrictEqual(
			new ast.Literal(BUCKET, 12345),
		)
	});

	test("new", () => {
		expect(parser(
			`new __class__`,
			{ new: new_ }
		).factor()).toStrictEqual(
			new ast.New(BUCKET, "__class__"),
		)
		expect(new_).toHaveBeenCalledTimes(1);
		new_.mockClear();
	});

	test("not", () => {
		expect(parser(
			`not __expr__`,
			{ expression }
		).factor()).toStrictEqual(
			new ast.UnaryOperator(BUCKET, expect.any(Function), new ast.Literal(BUCKET, "__expr__")),
		)
		expect(expression).toHaveBeenCalledTimes(1);
		expression.mockClear();
	});

	test("negative", () => {
		expect(parser(
			`- __expr__`,
			{ expression, variable }
		).factor()).toStrictEqual(
			new ast.UnaryOperator(BUCKET, expect.any(Function), new ast.Variable(BUCKET, ["__expr__"])),
		)
		expect(variable).toHaveBeenCalledTimes(1);
		variable.mockClear();
	});

	test("variable", () => {
		expect(parser(
			`__variable__`,
			{ variable }
		).factor()).toStrictEqual(
			new ast.Variable(BUCKET, ["__variable__"]),
		)
		expect(variable).toHaveBeenCalledTimes(1);
		variable.mockClear();
	});

	test("function call", () => {
		expect(parser(
			`__function__ ()`,
			{ variable, call }
		).factor()).toStrictEqual(
			new ast.Call(BUCKET, new ast.Variable(BUCKET, ["__function__"]), []),
		)
		expect(variable).toHaveBeenCalledTimes(1);
		expect(call).toHaveBeenCalledTimes(1);
		variable.mockClear();
		call.mockClear();
	});

	test("parenthesis", () => {
		expect(parser(
			`(__expr__)`,
			{ expression }
		).factor()).toStrictEqual(
			new ast.Parenthesis(BUCKET, new ast.Literal(BUCKET, "__expr__")),
		)
		expect(expression).toHaveBeenCalledTimes(1);
		expression.mockClear();
	});
});

