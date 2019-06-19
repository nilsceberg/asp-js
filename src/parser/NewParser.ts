import * as parser from "parser-monad";
import { ast } from "../program/NewAST";
import { nothing, empty, null_, str, boolean, integer, literal, number } from "./LiteralParser";
import * as data from "../program/Data";
import { Expr } from "../program/NewContext";
import "./ParserSettings";
import { cons, RawCharacter, Letter } from "parser-monad";
import { strEqual } from "./Util";
import { AccessLevel } from "../program/Access";
import { keyword, oneOrMore } from "./ParserBase";

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
	);

export const eol =
	optionalEol
	// TODO: there HAS to be a prettier way of handling this without lookahead,
	// but it will probably require a bit of refactoring:
	.or(parser.Lookahead(2).matches(s => s === "%>"))
	.or(eof)
	.or(parser.Error("expected end of statement"));
	
function op (Binary: new (left: Expr, right: Expr) => Expr): (left: Expr, right: Expr) => Expr {
	return (left, right) => new Binary(left, right);
}

const negatable: (p: parser.Parser<Expr>) => parser.Parser<Expr> = p =>
	parser.Default(parser.Accept("-").map(() => true), false)
	.then(p)
	.map(([negate, e]) =>
		!negate
		? e
		: new ast.expr.Sub(new ast.expr.Literal(new data.Number(0)), e)
	);

// The order of evaluation is from here: https://www.guru99.com/vbscript-operators-constants.html
// Might not be the most credible of sources...
export const arithmeticAndComparison: parser.Parser<Expr> = parser.Parser.lazy(() => parser.exprParser(
	[
		{
			"is": op(ast.expr.Is),
		},
		{
			"^": op(ast.expr.Pow),
		},
		{
			// The source above claims that multiplication has higher
			// precedence than division, but this is false - they are simply
			// left-to-right.
			"*": op(ast.expr.Mul),
			"/": op(ast.expr.Div),
			"\\": op(ast.expr.LongDiv),
		},
		{
			"+": op(ast.expr.Add),
			"-": op(ast.expr.Sub),
		},
		{
			"mod": op(ast.expr.Mod),
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
	[negatable(access), number, nothing, empty, null_, boolean, new_, str], // number is already negatable
	negatable(expr)
));

const not: parser.Parser<Expr> =
	keyword("not")
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

export const rem: parser.Parser<ast.Statement> =
	keyword("rem").first(RawCharacter.matches(c => c !== "\n").repeat()).map(() => new ast.DummyStatement);

export const singleStatement: parser.Parser<ast.Statement> =
	parser.Parser.lazy(() =>
		parser.Parser.orMany([
			keyword("statement").map(() => new ast.DummyStatement),
			call,
			assignment,
			subCall,
			func,
			sub,
			redim,
			dim,
			class_,
			if_,
			while_,
			doWhileLoop,
			doUntilLoop,
			doLoopWhile,
			doLoopUntil,
			doLoop,
			set,
			exit,
			option,
			forEach,
			for_,
			onError,
			select,
			with_,
			const_,
			rem,
		])
	);

export const statement: parser.Parser<ast.Statement> =
	parser.Parser.lazy(() =>
		singleStatement
		.first(eol)
		.or(printBlock.first(optionalEol.repeat()))
	);

export const statements: parser.Parser<ast.Statement[]> =
	statement.repeat()

export const KEYWORDS: string[] = [
	"IF",
	"ELSEIF",
	"ELSE",
	"FUNCTION",
	"SUB",
	"CALL",
	"CLASS",
	"END",
	"NEW",
	"DIM",
	"REDIM",
	"WEND",
	"LOOP",
	"NEXT",
	"CASE",
	"DO",
	"FOR",
	"WITH",
	"OPTION",
	"ON",
	"SELECT",
	"WHILE",
	"EXIT",
	"CONST",
	"WITH",
	"REM",
	"EMPTY",
	"NULL",
	"NOTHING",
	"TRUE",
	"FALSE",
];

export const isNotKeyword = (word: string): boolean => !KEYWORDS.includes(word.toUpperCase());
	
export const anyIdentifier = 
	parser.Token(
		parser.Letter
		.then((parser.Alphanumeric.or(parser.Character.matches(c => c === "_")).repeat().map(x => x.join(""))))
		.map(<(p: [string, string]) => string>parser.add)
	);

export const identifier = 
	anyIdentifier.matches(isNotKeyword)

function constructTrivialVariableRecursive(parent: Expr, components: string[]): Expr {
	if (components.length === 0) return parent;
	return constructTrivialVariableRecursive(
		new ast.Access(parent, components[0]),
		components.slice(1));
}

function constructTrivialVariable(components: string[]): Expr {
	return constructTrivialVariableRecursive(
		components[0] === "" ? null : new ast.Variable(components[0]),
		components.slice(1)
	);
}

export const trivialVariable: parser.Parser<Expr> =
	parser.Default(identifier, "")
	.then(oneOrMore(parser.Accept(".").second(anyIdentifier)))
	.map(cons)
	.or(identifier.map(x => [x]))
	.map(constructTrivialVariable);

export const new_: parser.Parser<ast.expr.New> =
	keyword("new")
	.second(trivialVariable)
	.map(v => new ast.expr.New(v));

export const args: () => parser.Parser<Expr[]> = () =>
	parser.Default(expr, null)
	.first(parser.Accept(","))
	.then(parser.Parser.lazy(args))
	.map(parser.cons)
	.or(expr.map(x => [x]))
	.or(parser.Return([]));

function constructFunctionCallRecursive(callee: Expr, argLists: Expr[][]): ast.FunctionCall {
	const left = new ast.FunctionCall(callee, argLists[0])
	if (argLists.length === 1) {
		return left;
	}
	else {
		return constructFunctionCallRecursive(left, argLists.slice(1));
	}
}

export const variable_: parser.Parser<Expr> = identifier.map(id => new ast.Variable(id));

export const applications: (f: Expr) => parser.Parser<Expr> = f =>
	parser.Accept("(")
	.second(args())
	.first(parser.Require(")"))
	.map(args => new ast.FunctionCall(f, args))
	.bind(applications)
	.or(parser.Return(f));

export const access_: (obj: Expr) => parser.Parser<Expr> = obj =>
	parser.Accept(".")
	.second(anyIdentifier)
	.map(id => new ast.Access(obj, id))
	.bind(applications)
	.bind(access_)
	.or(parser.Return(obj));

export const access: parser.Parser<Expr> =
	parser.Accept("(")
	.second(expr)
	.first(parser.Require(")"))
	.or(variable_)
	.bind(applications)
	.or(parser.Lookahead(1).matches(c => c === '.').map(() => null))
	.bind(access_);

export const lvalue: parser.Parser<ast.LValue> =
	access as parser.Parser<ast.LValue>

export const assignment: parser.Parser<ast.Assignment> =
	lvalue.first(parser.Accept("=")).then(expr)
	.map(([l, r]) => new ast.Assignment(l, r));

export const set: parser.Parser<ast.Assignment> =
	keyword("set").second(assignment);

export const emptyParens: parser.Parser<any[]> =
	parser.Accept("(").then(parser.Accept(")")).map(() => []);

// TODO: This solution is really dumb and fragile, please fix!!!
export const subApplications: (f: Expr) => parser.Parser<Expr> = f =>
	parser.Accept("(")
	.second(args())
	.first(
		parser.Require(")")
		.first(
			parser.Lookahead(1).matches(c => ![
					",", ":", "\n", "%", "&", "+", "-", "*", "/", "\\" // this is not just bad, it's wrong
				].includes(c)
			)
		)
	)
	.map(args => new ast.FunctionCall(f, args))
	.bind(subApplications)
	.or(parser.Return(f));

export const subAccess_: (obj: Expr) => parser.Parser<Expr> = obj =>
	parser.Accept(".")
	.second(anyIdentifier)
	.map(id => new ast.Access(obj, id))
	.bind(subApplications)
	.bind(subAccess_)
	.or(parser.Return(obj));

export const subAccess: parser.Parser<Expr> =
	parser.Accept("(")
	.second(expr)
	.first(parser.Require(")"))
	.or(variable_)
	.bind(subApplications)
	.or(parser.Lookahead(1).matches(c => c === '.').map(() => null))
	.bind(subAccess_);

export const subCall: parser.Parser<ast.FunctionCall> =
	subAccess.then(emptyParens.or(args())).map(([v, a]) => new ast.FunctionCall(v, a));

export const call: parser.Parser<ast.FunctionCall> =
	keyword("call").second(trivialVariable.then(
		parser.Accept("(").second(args()).first(parser.Require(")"))
	))
	.map(([v, a]) => new ast.FunctionCall(v, a));

export const dimension: parser.Parser<number[]> =
	parser.Accept("(")
	.second(
		parser.Integer
		.then(
			parser.Accept(",")
			.second(parser.Integer)
			.repeat())
		.map(cons)
		.or(parser.Return([]))
	)
	.first(parser.Require(")"));

export const dimDecl: (access: AccessLevel) => parser.Parser<ast.Dim> =
	access =>
	identifier
	.then(parser.Default(dimension, null))
	.map(([id, dim]) => new ast.Dim(id, dim, access));

export const accessLevel: parser.Parser<AccessLevel> =
	keyword("public")
	.or(keyword("private"))
	.map(a => strEqual(a, "private") ? AccessLevel.Private : AccessLevel.Public);

export const dim: parser.Parser<ast.Block> =
	accessLevel.or(keyword("dim").map(() => AccessLevel.Public))
	.bind(
		access =>
		dimDecl(access)
		.then(parser.Accept(",").second(dimDecl(access)).repeat())
		.map(cons)
	)
	.map(dims => new ast.Block(dims));

export const redimension: parser.Parser<Expr[]> =
	parser.Accept("(")
	.second(
		expr
		.then(
			parser.Accept(",")
			.second(expr)
			.repeat())
		.map(cons)
		.or(parser.Return([]))
	)
	.first(parser.Require(")"));

export const redimDecl: (preserve: boolean) => parser.Parser<ast.Redim> =
	preserve =>
	identifier
	.then(parser.Default(redimension, null))
	.map(([id, dim]) => new ast.Redim(id, dim, preserve));

export const redim: parser.Parser<ast.Block> =
	keyword("redim")
	.second(
		parser.Default(
			keyword("preserve").map(() => true),
			false
		)
	)
	.bind(preserve =>
		redimDecl(preserve)
		.then(parser.Accept(",").second(redimDecl(preserve)).repeat())
		.map(cons)
	)
	.map(redims => new ast.Block(redims));

export const argListArg: parser.Parser<ast.Argument> =
	parser.Default(
		keyword("byref")
		.or(keyword("byval"))
		.map(s => strEqual(s, "byref")),
		false)
	.bind(byRef =>
		identifier.map(name => new ast.Argument(name, byRef))
	);

export const argList: parser.Parser<ast.Argument[]> =
	argListArg
	.then(parser.Accept(",").second(argListArg).repeat())
	.map(cons)
	.or(parser.Return([]));

export const func: parser.Parser<ast.Function> =
	parser.Default(accessLevel, AccessLevel.Public)
	.then(
		keyword("function")
		.second(identifier)
		.then(parser.Default(
			parser.Accept("(").second(argList.first(parser.Require(")"))),
			[]
		))
		.first(eol)
		.then(statements)
		.first(parser.Require("end"))
		.first(parser.Require("function"))
	)
	.map(([access, [[n, a], b]]) => new ast.Function(n, a, b, access));

export const sub: parser.Parser<ast.Function> =
	parser.Default(accessLevel, AccessLevel.Public)
	.then(
		keyword("sub")
		.second(identifier)
		.then(parser.Default(
			parser.Accept("(").second(argList.first(parser.Require(")"))),
			[]
		))
		.first(eol)
		.then(statements)
		.first(parser.Require("end"))
		.first(parser.Require("sub"))
	)
	.map(([access, [[n, a], b]]) => new ast.Function(n, a, b, access));

export const getProperty: parser.Parser<ast.Statement> =
	parser.Default(accessLevel, AccessLevel.Public)
	.then(keyword("default").map(() => true).or(parser.Return(false)))
	.first(keyword("property"))
	.then(
		keyword("get")
		.second(identifier)
	)
	.then(
		parser.Accept("(").second(argListArg.map(x => [x])).first(parser.Require(")")).or(parser.Return([]))
	)
	.first(eol)
	.then(statements)
	.first(parser.Require("end"))
	.first(parser.Require("property"))
	.map(([[[[access, def], id], args], body]) =>
		new ast.Property(
			ast.PropertyType.Get,
			new ast.Function(
				id,
				args,
				body,
				access
			),
			def
		)
	);

export const setProperty: parser.Parser<ast.Statement> =
	parser.Default(accessLevel, AccessLevel.Public)
	.first(keyword("property"))
	.then(
		keyword("set").map(() => ast.PropertyType.Set)
		.or(keyword("let").map(() => ast.PropertyType.Let))
	)
	.then(identifier)
	.then(
		parser.Accept("(")
		.second(argListArg)
		.first(parser.Require(")"))
	)
	.first(eol)
	.then(statements)
	.first(parser.Require("end"))
	.first(parser.Require("property"))
	.map(([[[[access, type], id], arg], body]) =>
		new ast.Property(
			type,
			new ast.Function(
				id,
				[arg],
				body,
				access
			),
			false
		)
	);

export const classDecl: parser.Parser<ast.Statement> =
	parser.Parser.orMany<ast.Statement>([
		getProperty,
		setProperty,
		func,
		sub,
		dim,
	])
	.first(eol);

export const class_: parser.Parser<ast.Class> =
	keyword("class")
	.second(identifier)
	.first(eol)
	.then(classDecl.repeat())
	.first(parser.Require("end"))
	.first(parser.Require("class"))
	.map(([n, d]) => new ast.Class(n, d));

export const elseif: () => parser.Parser<ast.Statement[]> = () =>
	keyword("elseif")
	.second(expr)
	.first(parser.Require("then"))
	.first(eol)
	.then(statements)
	.then(
		parser.Parser.lazy(elseif)
		.or(keyword("else").first(eol).second(statements))
		.or(parser.Return([]))
	)
	.map(([[c, b], e]) => [new ast.If(c, b, e)])

const singleIf: parser.Parser<ast.If> =
	keyword("if")
	.second(expr)
	.first(parser.Require("then"))
	.then(singleStatement)
	.map(([c, s]) => new ast.If(c, [s], []));

export const if_: parser.Parser<ast.If> =
	singleIf
	.or(
		keyword("if")
		.second(expr)
		.first(parser.Require("then"))
		.first(eol)
		.then(statements)
		.then(
			elseif()
			.or(keyword("else").first(eol).second(statements))
			.or(parser.Return([]))
		)
		.first(parser.Require("end"))
		.first(parser.Require("if"))
		.map(([[c, s], e]) => new ast.If(c, s, e))
	);

export const while_: parser.Parser<ast.Statement> =
	keyword("while")
	.second(expr)
	.first(eol)
	.then(statements)
	.first(parser.Require("wend"))
	.map(([cond, body]) => new ast.Loop(cond, body, false, false));

// These four can probably be done in a prettier, more general way:
export const doWhileLoop: parser.Parser<ast.Statement> =
	keyword("do")
	.second(keyword("while"))
	.second(expr.or(parser.Error("expected expression")))
	.first(eol)
	.then(statements)
	.first(parser.Require("loop"))
	.map(([cond, body]) => new ast.Loop(cond, body, false, false));

export const doUntilLoop: parser.Parser<ast.Statement> =
	keyword("do")
	.second(keyword("until"))
	.second(expr.or(parser.Error("expected expression")))
	.first(eol)
	.then(statements)
	.first(parser.Require("loop"))
	.map(([cond, body]) => new ast.Loop(cond, body, true, false));

export const doLoopWhile: parser.Parser<ast.Statement> =
	keyword("do")
	.first(eol)
	.second(statements)
	.first(parser.Require("loop"))
	.first(keyword("while"))
	.then(expr.or(parser.Error("expected expression")))
	.map(([body, cond]) => new ast.Loop(cond, body, false, true));

export const doLoopUntil: parser.Parser<ast.Statement> =
	keyword("do")
	.first(eol)
	.second(statements)
	.first(parser.Require("loop"))
	.first(keyword("until"))
	.then(expr.or(parser.Error("expected expression")))
	.map(([body, cond]) => new ast.Loop(cond, body, true, true));

export const doLoop: parser.Parser<ast.Statement> =
	keyword("do")
	.first(eol)
	.second(statements)
	.first(parser.Require("loop"))
	.map((body) => new ast.Loop(new ast.expr.Literal(new data.Boolean(true)), body, false, false));

export const exit: parser.Parser<ast.Statement> =
	keyword("exit")
	.second(
		parser.Parser.orMany([
			keyword("function").map(() => ast.ExitType.Function),
			keyword("sub").map(() => ast.ExitType.Sub),
			keyword("property").map(() => ast.ExitType.Property),
			keyword("do").map(() => ast.ExitType.Do),
			keyword("for").map(() => ast.ExitType.For),
		])
		.or(parser.Error("expected function, sub, do, for, or property"))
	)
	.map(t => new ast.Exit(t));

export const option: parser.Parser<ast.Statement> =
	keyword("option")
	.second(
		parser.Parser.orMany([
			keyword("explicit").map(() => ast.OptionType.Explicit),
			parser.Error("expected option")
		])
	)
	.then(
		keyword("off").map(() => false)
		.or(parser.Allow("on").map(() => true))
	)
	.map(([opt, on]) => new ast.Option(opt, on));

export const for_: parser.Parser<ast.Statement> =
	keyword("for")
	.second(identifier)
	.first(parser.Require("="))
	.then(expr)
	.first(parser.Require("to"))
	.then(expr)
	.then(
		parser.Default(
			keyword("step").second(expr),
			new ast.expr.Literal(new data.Number(1))
		)
	)
	.first(eol)
	.then(statements)
	.first(parser.Require("next"))
	.map(([[[[id, from], to], step], body]) =>
		new ast.For(from, to, step, id, body)
	);

export const forEach: parser.Parser<ast.Statement> =
	keyword("for")
	.second(keyword("each"))
	.second(identifier)
	.first(parser.Require("in"))
	.then(expr)
	.first(eol)
	.then(statements)
	.first(parser.Require("next"))
	.map(([[id, obj], body]) =>
		new ast.ForEach(id, obj, body)
	);

export const onError: parser.Parser<ast.Statement> =
	keyword("on")
	.second(parser.Require("error"))
	.second(
		parser.Parser.orMany([
			keyword("resume").second(parser.Require("next")).map(() => ast.ErrorHandling.ResumeNext),
			keyword("goto").second(parser.Require("0")).map(() => ast.ErrorHandling.Goto0),
			parser.Error("expected 'resume next' or 'goto 0'")
		])
	)
	.map(handling => new ast.OnError(handling));

export const selectCase: parser.Parser<ast.SelectCase> =
	keyword("case")
	.second(keyword("else").map(() => null).or(args()))
	.first(eol)
	.then(statements)
	.map(([conds, body]) => new ast.SelectCase(conds, body));

export const select: parser.Parser<ast.Statement> =
	keyword("select")
	.second(parser.Require("case"))
	.second(expr)
	.first(eol)
	.then(selectCase.repeat()) // TODO: one ore more? at least an else (semantic verification)? not sure
	.first(parser.Require("end"))
	.first(parser.Require("select"))
	.map(([expr, cases]) => new ast.Select(expr, cases));

export const with_: parser.Parser<ast.Statement> =
	keyword("with")
	.second(expr)
	.first(eol)
	.then(statements)
	.first(parser.Require("end"))
	.first(parser.Require("with"))
	.map(([obj, body]) => new ast.With(obj, body));

export const const_: parser.Parser<ast.Statement> =
	keyword("const")
	.second(identifier)
	.first(parser.Require("="))
	.then(literal)
	.map(([name, literal]) => new ast.Const(name, literal));

export const printBlockCharacter: parser.Parser<string> =
	parser.RawLitSequence("<%")
	.or(parser.Accept("<!--").first(parser.Lit("#").first(keyword("include"))))
	.or(parser.RawCharacter)
	.bind(x => x === "<%" || x === "<!--" ? parser.Fail : parser.Return(x));

function responseWrite(e: Expr) {
	return new ast.FunctionCall(
		new ast.Access(new ast.Variable("Response"), "Write"),
		[e]
	);
}

export const inlinePrint: parser.Parser<ast.Statement> =
	parser.Accept("<%")
	.second(parser.Accept("="))
	.second(expr)
	.first(parser.Require("%>"))
	.map(responseWrite);

export const printBlockContentString: parser.Parser<ast.Statement> =
	printBlockCharacter
	.repeat()
	.map(s => responseWrite(new ast.expr.Literal(new data.String(s.join("")))));

export const include: parser.Parser<ast.Statement> =
	parser.Accept("<!--")
	.second(parser.Lit("#"))
	.second(keyword("include"))
	.second(
		keyword("file")
		.or(keyword("virtual"))
		.or(parser.Error("expected 'file' or 'virtual'"))
	)
	.then(
		parser.Require("=")
		.second(parser.Token(str).or(parser.Error("expected file name")))
		.first(parser.Require("-->"))
	)
	.map(([v, f]) => new ast.Include(
		f.value.value(),
		strEqual(v, "virtual")
	));

export const printBlockContent: parser.Parser<ast.Block> =
	printBlockContentString.then(
		(inlinePrint.or(include))
		.then(printBlockContentString).repeat()
		.map(xs => <ast.Statement[]>[].concat.apply([], xs))
	)
	.map(cons)
	.map(statements => new ast.Block(statements));

export const printBlock: parser.Parser<ast.Block> =
	parser.Accept("%>")
	.second(printBlockContent)
	.first(parser.Accept("<%").or(eof));

export const script: parser.Parser<ast.Statement[]> =
	parser.Spaces
	.then(optionalEol.repeat())
	.second(statements)
	.first(eof.or(parser.Error("expected end of file")));

export const scriptAsp: parser.Parser<ast.Statement[]> =
	printBlockContent.first(parser.Accept("<%"))
	.then(parser.Spaces
		.then(optionalEol.repeat())
		.second(statements)
		.first(eof.or(parser.Error("expected end of file")))
	).map(cons);
