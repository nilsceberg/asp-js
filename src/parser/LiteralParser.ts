import * as parser from "parser-monad";
import { ast } from "../program/NewAST";
import { not } from "./Util";
import * as data from "../program/Data";
import "./ParserSettings";

const isStringDelimiter = (x: string) => x === "\"";
const stringDelimiter = parser.Character.matches(isStringDelimiter);
const escapedStringDelimiter = stringDelimiter.second(stringDelimiter);

export const id = (x: any) => x;
export const negate = (x: number) => -x;

export const sign =
	parser.Token(parser.Lit("-")).map(_ => negate)
	.or(parser.Token(parser.Lit("+")).map(_ => id))
	.or(parser.Return(id));

export const integer: parser.Parser<ast.expr.Literal> =
	sign.bind(f => parser.Token(parser.Integer).map(x => new ast.expr.Literal(new data.Number(f(x)))));

export const number: parser.Parser<ast.expr.Literal> =
	sign.bind(f =>
		parser.Token(parser.Integer)
		.first(parser.Accept("."))
		.then(parser.Default(parser.Token(parser.Integer), 0))
		.map(([i, d]) => parseFloat(`${i}.${d}`))

		.or(
		parser.Accept(".")
		.second(parser.Token(parser.Integer))
		.map(d => parseFloat(`0.${d}`))
		)

		.or(
		parser.Token(parser.Integer)
		)
		
		.map(x => new ast.expr.Literal(new data.Number(f(x))))
	);

export const strChar: parser.Parser<parser.char> =
	parser.RawCharacter.matches(not(isStringDelimiter))
	.or(escapedStringDelimiter);

export const str: parser.Parser<ast.expr.Literal> =
	parser.Token(
		stringDelimiter
		.second(strChar.repeat())
		.map(cs => new ast.expr.Literal(new data.String(cs.join(""))))
		.first(stringDelimiter)
	);

export const boolean: parser.Parser<ast.expr.Literal> =
	parser.Accept("true").or(parser.Accept("false"))
	.map(x => new ast.expr.Literal(new data.Boolean(x === "true")));

export const empty: parser.Parser<ast.expr.Literal> =
	parser.Accept("empty")
	.map(() => new ast.expr.Literal(new data.Empty));

export const nothing: parser.Parser<ast.expr.Literal> =
	parser.Accept("nothing")
	.map(() => new ast.expr.Literal(new data.Nothing));

export const null_: parser.Parser<ast.expr.Literal> =
	parser.Accept("null")
	.map(() => new ast.expr.Literal(new data.Null));

export const literal: parser.Parser<ast.expr.Literal> =
	parser.Parser.orMany([nothing, empty, null_, boolean, str, number]);
