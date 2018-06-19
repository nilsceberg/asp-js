<%
	function welcome(name)
		if not name then
			welcome = "What is your name?"
		elseif name = "Nisse" then
			welcome = "Holy shit, it's you!"
		else
			welcome = "Welcome, " & name & "!"
		end if
	end function

	function nameForm()
		%>
		<br>
		<form method="GET" action="/">
			<input type="text" name="name">
			<input type="submit" value="Go!">
		</form>
		<%
	end function

	function bold(label)
		%><b><%= label %></b><%
	end function
%>
