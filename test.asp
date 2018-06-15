<html>
	<head>
		<title>Hello</title>
	</head>
	<%
		function bold(label)
			%><b><%
				response.write label
			%></b><%
		end function
	%>
	<body>
		<% bold "Welcome!" %>
	</body>
</html>

