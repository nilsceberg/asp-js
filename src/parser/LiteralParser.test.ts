import { SourcePointer, StringSource } from "parser-monad";
import { str, strChar, number } from "./LiteralParser";
import { ast } from "../program/NewAST";
import * as data from "../program/Data";

function src(s: string): SourcePointer {
	return new SourcePointer(new StringSource(s));
}

describe("string", () => {
	test("number", () => {
		const s1 = src('3');
		expect(number.parse(s1).from()[0]).toStrictEqual(
			new ast.expr.Literal(new data.Number(3))
		);

		const s2 = src('14.87');
		expect(number.parse(s2).from()[0]).toStrictEqual(
			new ast.expr.Literal(new data.Number(14.87))
		);

		const s3 = src('14.');
		expect(number.parse(s3).from()[0]).toStrictEqual(
			new ast.expr.Literal(new data.Number(14))
		);

		const s4 = src('.87');
		expect(number.parse(s4).from()[0]).toStrictEqual(
			new ast.expr.Literal(new data.Number(0.87))
		);

		const s5 = src('-14.87');
		expect(number.parse(s5).from()[0]).toStrictEqual(
			new ast.expr.Literal(new data.Number(-14.87))
		);

		const s6 = src('+14.87');
		expect(number.parse(s6).from()[0]).toStrictEqual(
			new ast.expr.Literal(new data.Number(14.87))
		);
	});

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
