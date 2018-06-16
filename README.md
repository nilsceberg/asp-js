# OpenVBS

An effort to create a VBScript interpreter with the ambition to
eventually allow for ASP Classic rendering in nginx.


## Scribbles and to-do

* ~Functions calls without parameter lists will be fun - maybe we need
  significant newlines for this? They should probably be significant anyway.~

* ~The lexer needs to be able to differentiate between real newlines and : when
  handling comments~

* Solve ambiguity:
  ```
  obj(1234689), 4
  obj(4) = 9
  ```

* evalFunction isn't quite how the namespaces are handled in VBScript,
  as it allows redefining a function name inside another scope and still
  access the function in function calls. It also probably will not work
  with the left-hand function call expressions for dictionaries, above.

* Related to the above, return values aren't quite implemented correctly.

* Current way of handling includes is not quite consistent with VBScript,
  as we allow it inside of <% ... %> tags -- anywhere, in fact!

## Features
* **expressions**: done
* **functions**: done
* **classes**: in progress
  * **objects**: done
  * **visibility**: to-do
* **includes**: in progress
  * **file**: done
  * **virtual**: to-do
* **byval**: to-do
* **byref**: to-do

### Stricly to-do
* Document binary operators (and maybe optimize, they are unlikely to be fast I believe)
* Refactor token stream and parser for better readability

## VBScript links
* and: https://stackoverflow.com/questions/10871895/boolean-not-operator-in-vbscript

