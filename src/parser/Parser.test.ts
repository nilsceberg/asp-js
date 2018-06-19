import "jest";

import { StringInputStream } from "./StringInputStream";
import { TokenStream } from "./TokenStream";
import { Parser } from "./Parser";
import { ast } from "./AST";
import { tokens } from "./Tokens";

function parser(code: string): Parser {
	return new Parser(new TokenStream(new StringInputStream(code, "<test>")));
}

const BUCKET = expect.anything();

test("parse function", () => {
	expect(parser(`function myFunc()\nend function`).function())
		.toStrictEqual(new ast.Function(
			BUCKET,
			new ast.Variable(BUCKET, ["myfunc"]),
			[],
			new ast.Block(BUCKET, [])));
});

test("parse dim", () => {
	expect(parser(`dim myVar`).dim())
		.toStrictEqual(new ast.Dim(BUCKET, "myvar"));
});

