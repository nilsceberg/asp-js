<%
	function welcome(name)
		if not name then
			welcome = "Welcome!"
		elseif name = "Nisse" then
			welcome = "Holy shit, it's you!"
		else
			welcome = "Welcome, " & name & "!"
		end if
	end function

	function bold(label)
		%><b><%
			response.write label
		%></b><%
	end function
%>
