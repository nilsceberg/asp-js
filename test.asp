<html>
	<head>
		<title>Hello</title>
	</head>
	<%
		function welcome(name)
			if name = "Nisse" then
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
	<body>
		<% bold welcome("Nils") %>
	</body>
</html>

