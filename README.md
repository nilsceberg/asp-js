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

