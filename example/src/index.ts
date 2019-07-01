import * as Koa from "koa";
import { NewKoaAspJs } from "asp-js";

const app = new Koa();

// Rewrite / to /index.asp
app.use((ctx, next) => {
	if (ctx.path === "/") {
		ctx.path = "/index.asp";
	}
	next();
});

// ASP.JS middleware, serving ASP files from the asp/ directory
//app.use(NewKoaAspJs("asp", {}));
app.use(NewKoaAspJs("asp"));

app.listen(8080, () => console.log("Listening on port 8080"));
