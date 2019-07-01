<%
Response.AddHeader "Content-Type", "text/html"
Response.AddHeader "Server", "Koa with ASP.JS"
%>
<!DOCTYPE html>
<html>
	<head>
		<title>ASP.JS Demo</title>
	</head>
	<!-- #include file="functions.asp" -->
	<body>
		<%
			dim name : name = Request.QueryString("name")
			bold welcome(Request.QueryString("name"))
			if not name then
				nameForm
			else
				%><br><a href="/">Forget me!</a><%
			end if
		%><br><br>
		<small>
			View this site's source code <a href="https://github.com/nilsceberg/asp-js/tree/master/example/asp">here</a>!<br>
			Parsed in <%= GetParseTime() %>, rendered in a total of <%= GetRenderTime() %> ms.
		</small>
	</body>
</html>
