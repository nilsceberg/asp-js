import * as parser from "parser-monad";
import { ast } from "./NewAST";
import { not } from "./Util";

const isStringDelimiter = (x: string) => x === "\"";
const stringDelimiter = parser.Character.matches(isStringDelimiter);
const escapedStringDelimiter = stringDelimiter.second(stringDelimiter);

export const strChar: parser.Parser<parser.char> =
	parser.Character.matches(not(isStringDelimiter))
	.or(escapedStringDelimiter);

export const str: parser.Parser<ast.expr.String> =
	stringDelimiter
	.second(strChar.repeat())
	.map(cs => new ast.expr.String(cs.join("")))
	.first(stringDelimiter);

export const boolean: parser.Parser<ast.expr.Boolean> =
	parser.Accept("true").or(parser.Accept("false"))
	.map(x => new ast.expr.Boolean(x === "true"));

export const empty: parser.Parser<ast.expr.Empty> =
	parser.Accept("empty")
	.map(() => new ast.expr.Empty);

export const nothing: parser.Parser<ast.expr.Nothing> =
	parser.Accept("nothing")
	.map(() => new ast.expr.Nothing);

export const null_: parser.Parser<ast.expr.Null> =
	parser.Accept("null")
	.map(() => new ast.expr.Null);
