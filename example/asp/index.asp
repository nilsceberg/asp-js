<%
Response.AddHeader "Content-Type", "text/html"
Response.AddHeader "Server", "Koa with ASP.JS"
%>
<!DOCTYPE html>
<html>
	<head>
		<title>ASP.JS Demo</title>
	</head>
	<!-- #include file "functions.asp" -->
	<body>
		<% bold welcome(Request.QueryString("name")) %>
	</body>
</html>

