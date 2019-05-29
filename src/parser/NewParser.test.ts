import { StringSource, SourcePointer, expr } from "parser-monad";
import { statement, statements, args } from "./NewParser";

function src(s: string): SourcePointer {
	return new SourcePointer(new StringSource(s));
}

test("statement", () => {
	const s = src("statement");
	expect(statement().parse(s).from()[0]).toStrictEqual("statement");
});

test("statements", () => {
	const s = src("statement \n statement statement : statement");
	expect(statements().parse(s).from()[0]).toStrictEqual([
		"statement",
		"statement",
		"statement",
		"statement",
	]);
});

test("args", () => {
	const s1 = src("3");
	const s2 = src("3, 4 + 1, (4+2)*3, 0");
	const s3 = src("0");

	const reference = [
		expr().parse(src("3")).from()[0],
		expr().parse(src("4 + 1")).from()[0],
		expr().parse(src("(4+2)*3")).from()[0],
		expr().parse(src("0")).from()[0],
	];

	expect(args().parse(s1).from()[0]).toEqual([reference[0]]);
	expect(args().parse(s2).from()[0].toString()).toEqual(reference.toString());
	expect(args().parse(s3).from()[0]).toEqual([reference[3]]);
});