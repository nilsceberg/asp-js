'option explicit

dim offByOne : offByOne = 3

class Myclass
	dim hejsan

	function test()
		wscript.echo hejsan
		hejsan = hejsan + 1
	end function
end class

set myObject = new MyClass
dim myObject
myObject.hejsan = 7654
myObject.test
myObject.test
myObject.test

echo 1234, 1

dim mul : mul = 14

'obj(1234689), 4
'obj(4) = 9

sub hej(x, a)
	wscript.echo x
end sub

sub echo(thing, b)
	Wscript.Echo thing
	Wscript.Echo b
end sub

function startFW(echo)
	dim first : first = 4
	startFW = first * (echo + offByOne)
	' you can't do this thing here
	'echo 88, 1
end function

function startSET()
	echo (startFW(2) * 2), 5
end function

function recurse()
'	function inner()
'		inner = 1339
'	end function

	'recurse = inner()
	recurse = 7575
	wscript.echo recurse
	recurse
end function

function test()
'	if 1 = 1 then
'		dim a : a = 19
'	end if
end function

Wscript.echo mul

'recurse
test
startSET

Wscript.echo mul
