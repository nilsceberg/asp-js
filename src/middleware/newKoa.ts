import { Script } from "../runtime/Script";

import * as Koa from "koa";
import * as path from "path";
import * as util from "util";
import { Context, DictObj, Box, NodeFunc } from "../program/NewContext";
import * as data from "../program/Data";

let renderStartTime: number;

function createGlobalContext(ctx: Koa.Context): Context {
    ctx.body = "";

    const globalContext = new Context();

    const responseObject = new DictObj();

    responseObject.fields["Write"] = new Box(new NodeFunc(
        ([contentBox]) => {
            const content = contentBox.get().value();
            console.log("Response.Write: ", content);
            ctx.body += content;
            return new Box(new data.Empty);
        },
        globalContext
    ));

    responseObject.fields["AddHeader"] = new Box(new NodeFunc(
        ([headerBox, valueBox]) => {
            const header: string = <any>headerBox.get().value();
            const value: string = <any>valueBox.get().value();

            ctx.set(header, value);

            return new Box(new data.Empty);
        },
        globalContext
    ));

    globalContext.declare("Response", responseObject);

    const requestObject = new DictObj();

    requestObject.fields["QueryString"] = new Box(new NodeFunc(
        ([name]) => {
            const key = name.get().value();
            console.log("Getting query string " + key);
            const value = ctx.query[key];

            if (value) {
                return new Box(new data.String(ctx.query[key]));
            }
            else {
                return new Box(new data.Nothing);
            }
        },
        globalContext
    ));

    globalContext.declare("Request", requestObject);

    globalContext.declare("GetRenderTime", new NodeFunc(
        () => {
            return new Box(new data.Number(Date.now() - renderStartTime));
        },
        globalContext
    ));

    return globalContext;
}

export function NewKoaAspJs(root: string): Koa.Middleware {
    return async (ctx: Koa.Context, next: () => Promise<any>) => {
        if (ctx.path.endsWith(".asp")) {
            renderStartTime = Date.now();
            const globalContext = createGlobalContext(ctx);
            
            const filename = path.join(root, ctx.path);
            console.log(`Starting render of file ${filename} at ${renderStartTime}`);
            // This should totally be async
            const script = Script.fromFile(filename, true, globalContext);
            console.log(`Parsed in ${Date.now() - renderStartTime} ms.`)

            console.log(util.inspect(script, {
                depth: null,
                colors: true,
            }));

            script.execute();
        }
    }
}