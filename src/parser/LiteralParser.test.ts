import { SourcePointer, StringSource } from "parser-monad";
import { str, strChar } from "./LiteralParser";
import { ast } from "../program/NewAST";
import * as data from "../program/Data";

function src(s: string): SourcePointer {
	return new SourcePointer(new StringSource(s));
}

describe("string", () => {
	test("char", () => {
		const s1 = src('x');
		expect(strChar.parse(s1).from()[0]).toEqual("x");

		const s2 = src('"');
		expect(strChar.parse(s2).isJust()).toBeFalsy()
	});

	test("garbage", () => {
		const s = src('hello world!"');
		expect(str.parse(s).isJust()).toBeFalsy();
	});

	test("simple", () => {
		const s = src('"hello world!"   ');
		const [result, rest] = str.parse(s).from();
		expect(result).toEqual(
			new ast.expr.Literal(new data.String("hello world!"))
		);
		expect(rest.equals("")).toBeTruthy();
	});

	test("escaped quotes", () => {
		const s = src('"hello ""world""!"');
		const [result, rest] = str.parse(s).from();
		expect(result).toEqual(
			new ast.expr.Literal(new data.String('hello "world"!'))
		);
		expect(rest.equals("")).toBeTruthy();
	});

	test("comment in string", () => {
		const s = src(`"he said, 'hello'!"`);
		const [result, rest] = str.parse(s).from();
		expect(result).toEqual(
			new ast.expr.Literal(new data.String(`he said, 'hello'!`))
		);
		expect(rest.equals("")).toBeTruthy();
	});
});
