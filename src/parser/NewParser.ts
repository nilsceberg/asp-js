import * as parser from "parser-monad";
import { ast } from "./NewAST";

export const statement: () => parser.Parser<ast.Statement> = () =>
	parser.Parser.orMany([
		parser.Accept("statement").map(x => new ast.DummyStatement),
		call,
		assignment,
		subCall,
		funcCall,
		func,
		sub,
		dim,
	]);

export const statements: () => parser.Parser<ast.Statement[]> = () => 
	parser.Spaces.second(statement()
	.first(parser.Accept(":").or(parser.Return("")))
	.repeat());

export const isNotKeyword = (word: string): boolean =>
	!["end"].includes(word);

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
	parser.expr()
	.first(parser.Accept(","))
	.then(parser.Parser.lazy(args))
	.map(parser.cons)
	.or(parser.expr().map(x => [x]))
	.or(parser.Return([]));

export const funcCall =
	variable.then(parser.Accept("(").second(args()).first(parser.Require(")")))
	.map(([v, a]) => new ast.FunctionCall(v, a));

export const lvalue: parser.Parser<ast.LValue> =
	(funcCall as parser.Parser<ast.LValue>).or(variable);

export const assignment: parser.Parser<ast.Assignment> =
	lvalue.first(parser.Accept("=")).then(parser.expr())
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
	.then(parser.Parser.lazy(statements))
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
	.then(parser.Parser.lazy(statements))
	.first(parser.Require("end"))
	.first(parser.Require("sub"))
	.map(([[n, a], b]) => new ast.Function(n, a, b));
