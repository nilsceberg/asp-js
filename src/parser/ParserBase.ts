import * as parser from "parser-monad";
import { cons, Letter } from "parser-monad";
import { strEqual } from "./Util";

export const oneOrMore: <T>(p: parser.Parser<T>) => parser.Parser<T[]> =
	p => p.then(p.repeat()).map(cons);

export const keyword: (word: string) => parser.Parser<string> =
	word =>
		parser.Token(Letter.repeat().map(s => s.join("")).matches(w => strEqual(w, word)));
