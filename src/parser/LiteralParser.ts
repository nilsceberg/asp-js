import * as parser from "parser-monad";
import { ast } from "../program/NewAST";
import { not } from "./Util";
import * as data from "../program/Data";
import "./ParserSettings";

const isStringDelimiter = (x: string) => x === "\"";
const stringDelimiter = parser.Character.matches(isStringDelimiter);
const escapedStringDelimiter = stringDelimiter.second(stringDelimiter);

export const strChar: parser.Parser<parser.char> =
	parser.RawCharacter.matches(not(isStringDelimiter))
	.or(escapedStringDelimiter);

export const str: parser.Parser<ast.expr.Literal> =
	stringDelimiter
	.second(strChar.repeat())
	.map(cs => new ast.expr.Literal(new data.String(cs.join(""))))
	.first(stringDelimiter);

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
