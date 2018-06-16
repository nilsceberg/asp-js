<html>
	<head>
		<title>Hello</title>
	</head>
	<%
		function bold(label)
			%><b><%
				if 6 + 4 then
					response.write label
				else
					response.write "nejdu"
				end if
			%></b><%
		end function
	%>
	<body>
		<% bold "Welcome!" %>
	</body>
</html>

