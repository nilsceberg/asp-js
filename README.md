# ASP.JS

**"The rumours of my demise have been greatly exaggerated."**\
*- Classic ASP*

ASP.JS brings classic Active Server Pages using VBScript
to the world of Node.
This project is as of yet a quick-and-dirty proof-of-concept, but just you
wait...!


## Scribbles

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

### To-do list
* Document binary operators (and maybe optimize, they are unlikely to be fast I believe)
* Refactor token stream and parser for better readability

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

## Language reference links
* and: https://stackoverflow.com/questions/10871895/boolean-not-operator-in-vbscript

