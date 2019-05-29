import { StringSource, SourcePointer, expr, Num } from "parser-monad";
import { statement, statements, args, identifier, variable, funcCall, assignment, subCall, call } from "./NewParser";
import { ast } from "./NewAST";

function src(s: string): SourcePointer {
	return new SourcePointer(new StringSource(s));
}

test("statement", () => {
	const s1 = src("statement");
	expect(statement().parse(s1).from()[0]).toStrictEqual(new ast.DummyStatement);

	const s2 = src("call sub (1, 2)");
	expect(statement().parse(s2).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["sub"]),
			[new Num(1), new Num(2)]
		)
	);

	// Fun ambiguity - let's see if it works!
	const s3 = src("sub (1), 2");
	expect(statement().parse(s3).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["sub"]),
			[new Num(1), new Num(2)]
		)
	);

	const s4 = src("dict (1) = 2");
	expect(statement().parse(s4).from()[0]).toStrictEqual(
		new ast.Assignment(
			new ast.FunctionCall(
				new ast.Variable(["dict"]),
				[new Num(1)]
			),
			new Num(2)
		)
	);

	const s5 = src("func (1)");
	expect(statement().parse(s5).from()[0]).toStrictEqual(
		new ast.FunctionCall(
			new ast.Variable(["func"]),
			[new Num(1)]
		)
	);
});

test("statements", () => {
	const s = src("statement \n statement statement : statement");
	expect(statements().parse(s).from()[0]).toStrictEqual([
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
		expr().parse(src("3")).from()[0],
		expr().parse(src("4 + 1")).from()[0],
		expr().parse(src("(4+2)*3")).from()[0],
		expr().parse(src("0")).from()[0],
	];

	expect(args().parse(s1).from()[0]).toEqual([reference[0]]);
	expect(args().parse(s2).from()[0].toString()).toEqual(reference.toString());
	expect(args().parse(s3).from()[0]).toEqual([reference[3]]);
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
		[new Num(1), new Num(2)]
	));
});

test("assignment", () => {
	const s1 = src("obj.f(1, 2) = 3");
	expect(assignment.parse(s1).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.FunctionCall(
			new ast.Variable(["obj", "f"]),
			[new Num(1), new Num(2)]
		),
		new Num(3)
	));

	const s2 = src("v = 3");
	expect(assignment.parse(s2).from()[0]).toStrictEqual(new ast.Assignment(
		new ast.Variable(["v"]),
		new Num(3),
	));
});

test("sub call", () => {
	const s = src("obj.sub (1), 2");

	expect(subCall.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Variable(["obj", "sub"]),
		[new Num(1), new Num(2)]
	));
});

test("call", () => {
	const s = src("call obj.sub ((1), 2)");

	expect(call.parse(s).from()[0]).toStrictEqual(new ast.FunctionCall(
		new ast.Variable(["obj", "sub"]),
		[new Num(1), new Num(2)]
	));
});
