import { SourcePointer, StringSource } from "parser-monad";
import { str, strChar } from "./ExprParser";
import { ast } from "./NewAST";

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
		const s = src('"hello world!"');
		const [result, rest] = str.parse(s).from();
		expect(result).toEqual(
			new ast.expr.String("hello world!")
		);
		expect(rest.equals("")).toBeTruthy();
	});
});
