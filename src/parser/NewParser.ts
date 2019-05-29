import * as parser from "parser-monad";
import { ast } from "./NewAST";

export const statement = () => parser.Accept("statement");
export const statements = () => 
	parser.Spaces.second(statement()
	.first(parser.Accept(":").or(parser.Return("")))
	.repeat());

export const identifier = parser.Token(parser.Letter.then(parser.Alphanumeric.repeat().map(x => x.join(""))).map(<(p: [string, string]) => string>parser.add));

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
	.or(parser.expr().map(x => [x]));

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
	parser.Accept("call")
	.second(variable.then(args()).map(([v, a]) => new ast.FunctionCall(v, a)));
