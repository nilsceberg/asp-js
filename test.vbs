function startFW(mul)
	dim first : first = 4
	startFW = first * (mul + 1)
end function

sub echo(thing, b)
	Wscript.Echo thing
	Wscript.Echo b
end sub

function startSET()
	call echo (startFW(2), 5)
end function

startSET

