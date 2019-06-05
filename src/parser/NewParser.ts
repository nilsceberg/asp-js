import * as parser from "parser-monad";
import { ast } from "../program/NewAST";
import { nothing, empty, null_, str, boolean } from "./LiteralParser";
import * as data from "../program/Data";
import { Expr } from "../program/NewContext";

parser.ParserSettings.WHITESPACE = " \t";
const EOL_CHARS = "\n:";

export const eof =
	parser.Character.or(parser.Return("")).matches(s => s === "");

const optionalEol =
	parser.Token(parser.Character.matches(c => EOL_CHARS.includes(c)))
	.first(
		parser.Character
		.matches(c => EOL_CHARS.includes(c))
		.first(parser.Spaces)
		.repeat()
	)

export const eol =
	optionalEol
	.or(eof)
	.or(parser.Error("expected end of statement"));

const id = (x: any) => x;
const negate = (x: number) => -x;

export const sign =
	parser.Token(parser.Lit("-")).map(_ => negate)
	.or(parser.Token(parser.Lit("+")).map(_ => id))
	.or(parser.Return(id));

export const integer: parser.Parser<ast.expr.Literal> =
	sign.bind(f => parser.Token(parser.Integer).map(x => new ast.expr.Literal(new data.Number(f(x)))));
	
function op (Binary: new (left: Expr, right: Expr) => Expr): (left: Expr, right: Expr) => Expr {
	return (left, right) => new Binary(left, right);
}

// The order of evaluation is from here: https://www.guru99.com/vbscript-operators-constants.html
// Might not be the most credible of sources...
export const arithmeticAndComparison: parser.Parser<Expr> = parser.Parser.lazy(() => parser.exprParser(
	[
		{
			"^": op(ast.expr.Pow),
		},
		{
			// The source above claims that multiplication has higher
			// precedence than division, but this is false - they are simply
			// left-to-right.
			"*": op(ast.expr.Mul),
			"/": op(ast.expr.Div),
		},
		{
			"+": op(ast.expr.Add),
			"-": op(ast.expr.Sub),
		},
		{
			"%": op(ast.expr.Mod),
		},
		{
			"&": op(ast.expr.Concat),
		},
		{
			"<=": op(ast.expr.LessThanOrEqual),
			">=": op(ast.expr.GreaterThanOrEqual),
			"<>": op(ast.expr.NotEqual),
			"=": op(ast.expr.Equal),
			"<": op(ast.expr.LessThan),
			">": op(ast.expr.GreaterThan),
		},
	],
	[nothing, empty, null_, boolean, new_, str, funcCall, variable, integer],
	expr
));

const not: parser.Parser<Expr> =
	parser.Accept("not")
	.second(arithmeticAndComparison)
	.map(x => new ast.expr.Not(x));

export const expr: parser.Parser<Expr> = parser.Parser.lazy(() => parser.exprParser(
	[
		{
			"and": op(ast.expr.And),
		},
		{
			"or": op(ast.expr.Or),
		},
		{
			"xor": op(ast.expr.Xor),
		},
	],
	[not, arithmeticAndComparison]
));

export const statement: () => parser.Parser<ast.Statement> = () =>
	parser.Parser.orMany([
		parser.Accept("statement").map(() => new ast.DummyStatement),
		call,
		assignment,
		subCall,
		func,
		sub,
		dim,
		class_,
		if_,
		set,
	])
	.first(eol);

export const statements: parser.Parser<ast.Statement[]> =
	parser.Parser.lazy(statement).repeat()

export const KEYWORDS: string[] = [
	"if",
	"elseif",
	"else",
	"function",
	"sub",
	"call",
	"class",
	"end",
	"new",
	"dim",
];

export const isNotKeyword = (word: string): boolean =>
	!KEYWORDS.includes(word);

export const identifier = 
	parser.Token(
		parser.Letter
		.then(parser.Alphanumeric.repeat().map(x => x.join("")))
		.map(<(p: [string, string]) => string>parser.add)
		.matches(isNotKeyword)
	);

export const variable_: () => parser.Parser<string[]> = () =>
	identifier
	.first(parser.Accept("."))
	.then(parser.Parser.lazy(variable_))
	.map(parser.cons)
	.or(identifier.map(x => [x]))

export const variable: parser.Parser<ast.Variable> =
	variable_().map(components => new ast.Variable(components));

export const new_: parser.Parser<ast.expr.New> =
	parser.Accept("new")
	.second(variable)
	.map(v => new ast.expr.New(v));

export const args: () => parser.Parser<Expr[]> = () =>
	expr
	.first(parser.Accept(","))
	.then(parser.Parser.lazy(args))
	.map(parser.cons)
	.or(expr.map(x => [x]))
	.or(parser.Return([]));

export const funcCall =
	variable.then(parser.Accept("(").second(args()).first(parser.Require(")")))
	.map(([v, a]) => new ast.FunctionCall(v, a));

export const lvalue: parser.Parser<ast.LValue> =
	(funcCall as parser.Parser<ast.LValue>).or(variable);

export const assignment: parser.Parser<ast.Assignment> =
	lvalue.first(parser.Accept("=")).then(expr)
	.map(([l, r]) => new ast.Assignment(l, r));

export const set: parser.Parser<ast.Assignment> =
	parser.Accept("set").second(assignment);

export const subCall: parser.Parser<ast.FunctionCall> =
	variable.then(args()).map(([v, a]) => new ast.FunctionCall(v, a));

export const call: parser.Parser<ast.FunctionCall> =
	parser.Accept("call").second(variable.then(
		parser.Accept("(").second(args()).first(parser.Require(")"))
	))
	.map(([v, a]) => new ast.FunctionCall(v, a));

export const dim: parser.Parser<ast.Dim> =
	parser.Accept("dim")
	.second(identifier)
	.then(
		parser.Accept("(")
		.second(parser.Integer)
		.first(parser.Require(")"))
		.or(parser.Return(-1))
		)
	.map(([name, length]) => new ast.Dim(name, length));

export const argListArg: parser.Parser<ast.Argument> =
	identifier.map(name => new ast.Argument(name));

export const argList: () => parser.Parser<ast.Argument[]> = () =>
	argListArg
	.first(parser.Accept(","))
	.then(parser.Parser.lazy(argList))
	.map(parser.cons)
	.or(argListArg.map(x => [x]))
	.or(parser.Return([]));

export const func: parser.Parser<ast.Function> =
	parser.Accept("function")
	.second(identifier)
	.then(parser.Default(
		parser.Accept("(").second(argList().first(parser.Require(")"))),
		[]
	))
	.first(eol)
	.then(statements)
	.first(parser.Require("end"))
	.first(parser.Require("function"))
	.map(([[n, a], b]) => new ast.Function(n, a, b));

export const sub: parser.Parser<ast.Function> =
	parser.Accept("sub")
	.second(identifier)
	.then(parser.Default(
		parser.Accept("(").second(argList().first(parser.Require(")"))),
		[]
	))
	.first(eol)
	.then(statements)
	.first(parser.Require("end"))
	.first(parser.Require("sub"))
	.map(([[n, a], b]) => new ast.Function(n, a, b));

export const classDecl: parser.Parser<ast.Statement> =
	parser.Parser.orMany<ast.Statement>([
		func,
		sub,
		dim,
	])
	.first(eol);

export const class_: parser.Parser<ast.Class> =
	parser.Accept("class")
	.second(identifier)
	.first(eol)
	.then(classDecl.repeat())
	.first(parser.Require("end"))
	.first(parser.Require("class"))
	.map(([n, d]) => new ast.Class(n, d));

export const elseif: () => parser.Parser<ast.Statement[]> = () =>
	parser.Accept("elseif")
	.second(expr)
	.first(parser.Require("then"))
	.first(eol)
	.then(statements)
	.then(
		parser.Parser.lazy(elseif)
		.or(parser.Accept("else").first(eol).second(statements))
	)
	.map(([[c, b], e]) => [new ast.If(c, b, e)])

export const if_: parser.Parser<ast.If> =
	parser.Accept("if")
	.second(expr)
	.first(parser.Require("then"))
	.first(eol)
	.then(statements)
	.then(
		elseif()
		.or(parser.Accept("else").first(eol).second(statements))
		.or(parser.Return([]))
	)
	.first(parser.Require("end"))
	.first(parser.Require("if"))
	.map(([[c, s], e]) => new ast.If(c, s, e));

export const script =
	parser.Spaces
	.then(optionalEol.repeat())
	.second(statements)
	.first(eof.or(parser.Error("expected end of file")));
