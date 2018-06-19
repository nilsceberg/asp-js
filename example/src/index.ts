import * as Koa from "koa";
import { KoaAspJs } from "asp-js";

const app = new Koa();

// Rewrite / to /index.asp
app.use((ctx, next) => {
	if (ctx.path === "/") {
		ctx.path = "/index.asp";
	}
	next();
});

// ASP.JS middleware, serving ASP files from the asp/ directory
app.use(KoaAspJs("asp", {}));

app.listen(8080);

