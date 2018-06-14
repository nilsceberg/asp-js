function startFW(mul)
	dim first : first = 4
	startFW = first * (mul + 1)
end function

function startSET()
	Wscript.Echo startFW(2)
end function

startSET

