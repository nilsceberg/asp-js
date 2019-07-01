import { Script } from "../runtime/Script";

import * as Koa from "koa";
import * as path from "path";
import * as util from "util";

let renderStartTime: number;

export function NewKoaAspJs(root: string): Koa.Middleware {
    return async (ctx: Koa.Context, next: () => Promise<any>) => {
        if (ctx.path.endsWith(".asp")) {
            renderStartTime = Date.now();
            
            const filename = path.join(root, ctx.path);
            console.log(`Starting render of file ${filename} at ${renderStartTime}`);
            // This should totally be async
            const script = Script.fromFile(filename);
            console.log(`Parsed in ${Date.now() - renderStartTime} ms.`)

            console.log(util.inspect(script, {
                depth: null,
                colors: true,
            }));

            script.execute();
        }
    }
}