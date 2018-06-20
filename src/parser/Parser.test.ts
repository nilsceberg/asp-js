import "jest";

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

test("parse variable", () => {
	expect(parser(
		`_some_thing123.some_thing_other_._last`
	).variable()).toStrictEqual(
		new ast.Variable(BUCKET, ["_some_thing123", "some_thing_other_", "_last"])
	);
});

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

test("parse dim", () => {
	expect(parser(`dim myVar`).dim())
		.toStrictEqual(new ast.Dim(BUCKET, "myvar"));
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

