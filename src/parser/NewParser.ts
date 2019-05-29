import * as parser from "parser-monad";

export const statement = () => parser.Accept("statement");
export const statements = () => 
	parser.Spaces.second(statement()
	.first(parser.Accept(":").or(parser.Return("")))
	.repeat());


export const identifier = parser.Letter.then(parser.Alphanumeric).map(<(p: [string, string]) => string>parser.add);

export const args: () => parser.Parser<parser.Expr[]> = () =>
	parser.expr()
	.first(parser.Accept(","))
	.then(parser.Parser.lazy(args))
	.map(parser.cons)
	.or(parser.expr().map(x => [x]));
