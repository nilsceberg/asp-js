import * as parser from "parser-monad";
import { ast } from "./NewAST";

parser.ParserSettings.WHITESPACE = " \t";
const EOL_CHARS = "\n:";

export const eof =
	parser.Character.or(parser.Return("")).matches(s => s === "");

export const eol =
	parser.Token(parser.Character.matches(c => EOL_CHARS.includes(c)))
	.first(
		parser.Character
		.matches(c => EOL_CHARS.includes(c))
		.first(parser.Spaces)
		.repeat()
	)
	.or(eof)
	.or(parser.Error("expected end of statement"));

export const statement: () => parser.Parser<ast.Statement> = () =>
	parser.Parser.orMany([
		parser.Accept("statement").map(() => new ast.DummyStatement),
		call,
		assignment,
		subCall,
		funcCall,
		func,
		sub,
		dim,
		class_,
		if_,
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

export const args: () => parser.Parser<parser.Expr[]> = () =>
	parser.expr
	.first(parser.Accept(","))
	.then(parser.Parser.lazy(args))
	.map(parser.cons)
	.or(parser.expr.map(x => [x]))
	.or(parser.Return([]));

export const funcCall =
	variable.then(parser.Accept("(").second(args()).first(parser.Require(")")))
	.map(([v, a]) => new ast.FunctionCall(v, a));

export const lvalue: parser.Parser<ast.LValue> =
	(funcCall as parser.Parser<ast.LValue>).or(variable);

export const assignment: parser.Parser<ast.Assignment> =
	lvalue.first(parser.Accept("=")).then(parser.expr)
	.map(([l, r]) => new ast.Assignment(l, r));

export const subCall: parser.Parser<ast.FunctionCall> =
	variable.then(args()).map(([v, a]) => new ast.FunctionCall(v, a));

export const call: parser.Parser<ast.FunctionCall> =
	parser.Accept("call").second(variable.then(
		parser.Accept("(").second(args()).first(parser.Require(")"))
	))
	.map(([v, a]) => new ast.FunctionCall(v, a));

export const dim: parser.Parser<ast.Dim> =
	parser.Accept("dim").second(identifier).map(name => new ast.Dim(name));

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
	.first(parser.Require("("))
	.then(argList())
	.first(parser.Require(")"))
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

export const classDecl =
	parser.Parser.orMany([
		func,
		sub,
		dim,
	])
	.first(eol);

export const class_ =
	parser.Accept("class")
	.second(identifier)
	.first(eol)
	.then(classDecl.repeat())
	.first(parser.Require("end"))
	.first(parser.Require("class"))
	.map(([n, d]) => new ast.Class(n, d));

export const elseif: () => parser.Parser<ast.Statement[]> = () =>
	parser.Accept("elseif")
	.second(parser.expr)
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
	.second(parser.expr)
	.first(parser.Require("then"))
	.first(eol)
	.then(statements)
	.then(
		elseif()
		.or(parser.Accept("else").first(eol).second(statements))
	)
	.first(parser.Require("end"))
	.first(parser.Require("if"))
	.map(([[c, s], e]) => new ast.If(c, s, e));

