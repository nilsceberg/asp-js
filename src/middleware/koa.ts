import { Interpreter, ScriptCache } from "../runtime/Interpreter";
import { Box, Context } from "../runtime/Context";

import * as Koa from "koa";
import * as path from "path";

let renderStartTime: number;

function createEnvironment(ctx: Koa.Context): any {
	ctx.body = "";
	return {
		"response": new Box({
			"write": new Box((context: Context, thing: any) => {
				ctx.body += thing.toString();
			}),
			"addheader": new Box((context: Context, header: string, value: string) => {
				ctx.set(header, value);
			}),
		}),
		"request": new Box({
			"querystring": new Box((context: Context, key: string) => {
				return ctx.query[key];
			}),
		}),
		"getrendertime": new Box((context: Context) => {
			return Date.now() - renderStartTime;
		}),
	};
}

export function KoaAspJs(root: string, scriptCache: ScriptCache = null): Koa.Middleware {
	return async (ctx: Koa.Context, next: () => Promise<any>) => {
		if (ctx.path.endsWith(".asp")) {
			renderStartTime = Date.now();
			const interpreter = new Interpreter(createEnvironment(ctx), scriptCache);
			try {
				interpreter.runFile(path.join(root, ctx.path));
			}
			catch (e) {
				ctx.body = e.stack;
			}
		}
		else {
			return next();
		}
	}
}

