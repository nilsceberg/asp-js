function startFW(mul)
	dim first : first = 4
	startFW = first * mul
end function

function startSET()
	Wscript.Echo startFW(5)
end function

startSET

