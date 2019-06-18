This document is roughly a reflection of what is actually implemented.
It is updated as things are added, but note that it's updated before the change
is made to the code. Thus it may list a few things that are not implemented yet.
These things *should* be marked with "TODO", but may not be.


### General Syntax ###

```
eol = ":" | "\n" | EOF

singleStatement = call | assignment | subCall | option | onError | class | function | sub | dim | redim |
    singleIf | if | doWhileLoop | doLoopWhile | doUntilLoop | doLoopUntil | doLoop | for |
    forEach | while | exit | select | const

statement = singleStatement eol

class = "class" identifier eol classDecl* "end" "class"
classDecl = (dim | function | sub | getProperty | setProperty) eol

accessLevel = "public" | "private" 
function = accessLevel? "function" identifier ("(" argList ")")? eol statements "end" "function"
sub = accessLevel? "sub" identifier ("(" argList ")")? eol statements "end" "sub"

dimension = "(" ")" | ("(" integer ("," integer)* ")")
dimDecl = identifier dimension?
dim = ("dim" | access) dimDecl ("," dimDecl)*

redimension = "(" ")" | ("(" expr ("," expr)* ")")
redimDecl = identifier redimension?
redim = "redim" "preserve"? redimDecl ("," redimDecl)* 

getProperty = accessLevel? "default"? "property" "get" identifier ("(" ")")? eol statements "end" "property"
setProperty = accessLevel? "property" ("set" | "let") identifier "(" argListArg ")" eol statements "end" "property"

argList = (argListArg ("," argList)*)?
argListArg = ("byval" | "byref")? identifier

assignment = lvalue "=" expr
lvalue = access
set = "set" assignment

args = expr | expr "," args
call = "call" trivialVariable "(" args ")"                    # let's keep old variable for this one
subCall = subAccess ("(" ")" | args)                    # probably this one too? VBScript is quirky

anyIdentifier = IDENTIFIER
identifier = (anyIdentifier : not keyword)

# This isn't actually how it's implemented - should probably be changed to reflect that.
if = "if" expr "then" eol statements ("elseif" condition "then" eol statements)* ("else" eol statements)? "end" "if"
singleIf = "if" expr "then" singleStatement

while = "while" expr eol statements "wend"

doWhileLoop = "do" "while" expr eol statements "loop"
doLoopWhile = "do" eol statements "loop" "while" expr

doWhileUntil = "do" "until" expr eol statements "loop"
doUntilWhile = "do" eol statements "loop" "until" expr

doLoop = "do" eol statements "loop"

for = "for" identifier "=" expr "to" expr ("step" expr)? eol statements "next"
forEach = "for" "each" identifier "in" expr eol statements "next"

exit = "exit" ("function" | "sub" | "do" | "for" | "property")

option = "option" optionName ("on" | "off")?
optionName = "explicit"

onError = "on" "error" ("resume" "next" | "goto" "0")

select = "select" "case" expr eol selectCase+ "end" "select"
selectCase = "case" ("else" | args) eol statements            # this expr should probably be a literal

statements = statement*

trivialVariable = identifier? ("." anyIdentifier)+ | identifier

with = "with" expr eol statements "end" "with"

new = "new" trivialVariable                                   # TODO: should this simply be identifier?

const = "const" identifier "=" literal

# Binds explicit because this one is nontrivial
variable' = identifier
applications(f) = "(" args ")" >>= applications | f
accessPrefix'(obj) = "." anyIdentifier >>= applications :"." >>= access' | obj
accessPrefix = ("(" expr ")" | variable') >>= applications) | "") >>= access'
access = (accessPrefix "." anyIdentifier) | variable' >>= applications
subAccess = (accessPrefix "." anyIdentifier) | variable'

```


### Literals ###

```
string = "\"" stringChar* "\""
stringChar = . | ("\"\"" -> "\"")

number = INTEGER "." INTEGER? | "." INTEGER | INTEGER
```
