<html>
	<head>
		<title>Hello</title>
	</head>
	<%
		function bold(label)
			%><b><%
				if 6 = 6 "or" 4 = 1 then
					response.write label
				elseif 5 + 7 then
					response.write "elseif"
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

