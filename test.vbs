function startFW(mul)
	dim first : first = 4
	startFW = first * (mul + 1)
end function

function echo(thing)
	Wscript.Echo thing
end function

function startSET()
	echo startFW(2)
end function

startSET

