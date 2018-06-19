sub increaseByRef(byref x)
	x = x + 1
	print "sub: " & x
end sub

sub increaseByVal(x)
	x = x + 1
	print "sub: " & x
end sub

sub print(thing)
	wscript.echo thing
end sub

dim v : v = 10
print v
increaseByRef v
print v
increaseByVal v
print v
increaseByRef v
print v
increaseByRef (v)
print v
increaseByRef v * 2
print v

print 2 * (3 + 4)

