import * as parser from "parser-monad";
import { ast } from "./NewAST";
import { not } from "./Util";

const isStringDelimiter = (x: string) => x === "\"";
const stringDelimiter = parser.Character.matches(isStringDelimiter);

export const strChar: parser.Parser<parser.char> =
	parser.Character.matches(not(isStringDelimiter));

export const str: parser.Parser<ast.expr.String> =
	stringDelimiter
	.second(strChar.repeat())
	.map(cs => new ast.expr.String(cs.join("")))
	.first(stringDelimiter);
