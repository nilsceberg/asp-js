This document is roughly a reflection of what is actually implemented.
It is updated as things are added, but note that it's updated before the change
is made to the code. Thus it may list a few things that are not implemented yet.
These things *should* be marked with "TODO", but may not be.


### General Syntax ###

```
eol = ":" | "\n" | EOF

statement = (option | onError | class | function | sub | dim | redim | assignment | subCall |
    singleIf | if | doWhileLoop | doLoopWhile | doUntilLoop | doLoopUntil | for |
    forEach | while | exit | select | call) eol

class = "class" identifier eol classDecl* "end" "class"
classDecl = (dim | function | sub | getProperty | setProperty) eol

access = "public" | "private" 
function = access? "function" identifier ("(" argList ")")? eol statements "end" "function"
sub = access? "sub" identifier ("(" argList ")")? eol statements "end" "sub"

dimension = "(" ")" | ("(" integer ("," integer)* ")")
dimDecl = identifier dimension?
redimDecl = identifier dimension?
dim = ("dim" | access) dimDecl ("," dimDecl)*
redim = "redim" "preserve"? redimDecl ("," redimDecl)* 

getProperty = access? "default"? "property" "get" identifier ("(" ")")? eol statements "end" "property"
setProperty = access? "property" ("set" | "let") identifier "(" argListArg ")" eol statements "end" "property"

argList = (argListArg ("," argList)*)?
argListArg = ("byval" | "byref")? identifier

assignment = lvalue "=" expr
lvalue = variable | funcCall
set = "set" assignment

funcCall = variable "(" args ")"
args = expr | expr "," args
call = "call" variable "(" args ")"

subCall = variable args

identifier = IDENTIFIER

if = "if" expr "then" eol statements ("elseif" condition "then" eol statements)* ("else" eol statements)? "end" "if"
singleIf = "if" expr "then" statement

# TODO
while = "while" expr eol statements "wend"

# TODO
doWhileLoop = "do" "while" expr eol statements "loop"
doLoopWhile = "do" eol statements "loop" "while" expr

# TODO
doWhileUntil = "do" "until" expr eol statements "loop"
doUntilWhile = "do" eol statements "loop" "until" expr

# TODO
for = "for" identifier "=" expr "to" expr ("step" expr)? eol statements "next"
forEach = "for" "each" identifier "in" expr eol statements "next"

# TODO
exit = "exit" ("function" | "sub" | "do" | "for" | "loop")

# TODO
option = "option" optionName
optionName = "explicit"

# TODO
onError = "on" "error" ("resume" "next" | "goto" "0")

# TODO
select = "select" "case" expr eol selectCase+ "end" "case"
selectCase = "case" ("else" | expr) eol statements            # this expr should probably be a literal

statements = statement*

variable = identifier? ("." identifier)+ | identifier

# TODO
with = "with" expr eol statements "end" "with"

new = "new" variable    # TODO: should this simply be identifier?
```


### Literals ###

```
string = "\"" stringChar* "\""
stringChar = . | ("\"\"" -> "\"")
```
