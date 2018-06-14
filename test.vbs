function startFW(mul)
	dim first : first = 4
	startFW = first * (mul + 1)
end function

sub echo(thing, b)
'	Wscript.Echo thing
'	Wscript.Echo b
end sub

function startSET()
	echo startFW(2) * 2, 5
end function

function recurse()
	function inner()
		inner = 1339
	end function

	recurse = inner()
'	Wscript.Echo recurse
end function

'recurse

'echo hejsan, 1337
startSET

