# VBScript

This is an attempt to document the VBScript language as it is reimplemented.


## Statements

Stand-alone expressions are not statements.


## Functions

Functions come in two flavors: subroutines (`sub`) and functions (`function`).
Documentation around the internet often claims that calling a function as a
statement must be done using the `call` keyword, but that doesn't seem to be true.

The difference seems to be that both functions and subroutines can be called as a
statement - either with the syntax

```vbscript
mySub arg1, arg2
```

or with

```vbscript
call mySub (arg1, arg2)
```

Note the parentheses. This is what is called a subroutine call.

However, only functions can be called as an expression and have a return value.
Expression function calls have their arguments in parentheses, but the parentheses
can be omitted if the function takes no arguments.

Returning a value can only be done in a function, by assigning the return value
to the function itself. Doing this in a subroutine yields the runtime error "Illegal assignment" (800a01f5).

Functions and subroutines can be terminated early using `exit function` or
`exit sub`, respectively.


## Scope

The scopes and namespaces of variables and functions seem to overlap but not
be the same completely, especially when returning a value from a function.

A recursive function call with an accumulator might look like:

```vbscript
function f(n)
	' ...
	f = f + f(n-1)
end function
```

Clearly `f` and `f(n-1)` can be distinguished. However, trying to define a function
whose name collides with an already defined `dim` yields a "Name redefined" error.

The following example illustrates how things seem to work:

```vbscript
dim flag : flag = false
function thing()
	if flag then
		thing = 1
		exit function
	end if

	thing = 2
	flag = true
	thing = thing + thing()
end function
```

This returns 3. If the parentheses are removed from the second `thing` in the last line, it yields 4. Thus, when inside a function, calls to itself must have the parentheses
even if the function takes no arguments; otherwise it is interpreted as a reference to the return value.

Other than this, scope doesn't seem to be too confusing:

* All declarations seem to be "hoisted" to the top of their scope.
* Explicit dims are not required unless `option explicit` is set.
* Classes, functions and subs make up scopes.
* Classes can only be declared at the top level; functions and subs only at
  the top level or within classes. Anything else is a syntax error.
  Note however that since if statements and such do not make up new scopes,
  things can be declared in them and still be accessed outside the if statement
  (regardless of whether the if statement was executed or not).
* Things declared (explicitly or implicitly) inside a scope are not accessible
  outside of it, and hide things outside of it - as expected.
* Names cannot be redefined in the same scope - there is no "undim".


## Variables and assignment

Variables are declared using the `dim` keyword, but this is not required
unless `option explicit` is set.

Arrays are declared using `dim myArray(length)`.

Assignment is done using `myVar = someExpression`. While they cannot be declared in
VBScript (citation needed), functions that return l-values are syntactically valid
and this fact is used for array and dictionary indexing: `myArray(3) = 123`.


### Set

**TODO**!


## By-value and by-reference parameters

Parameters can be passed by-value and by-reference, using the keywords
`byVal` and `byRef` in the function's argument list.

ByRef only works, of course, with l-values. L-values can be converted to
r-values using parentheses when passing them to a function (citation needed).

**TODO**: this needs more work.


## Directives

* `option explicit`
* more...
