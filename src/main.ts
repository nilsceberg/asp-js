import { InputStream } from "./InputStream";
import { TokenStream } from "./TokenStream";
import { Parser } from "./Parser";
import { Interpreter, Context, Box } from "./Interpreter";

import * as util from "util";

console.log("OpenVBS v1.0.0");

const input = new InputStream("test.asp");
const tokens = new TokenStream(input, true);
const parser = new Parser(tokens);
const program = parser.parse();

// Uncomment to dump AST:
//console.log(util.inspect(program, {
//	depth: null,
//	colors: true,
//}));

const interpreter = new Interpreter({
	"wscript": new Box({
		"echo": new Box((context: Context, thing: any) => {
			if (!thing) {
				console.log("");
			}
			else {
				console.log(thing);
			}
		})
	}),
	"response": new Box({
		"write": new Box((context: Context, thing: any) => {
			console.log(thing);
		})
	})
});
interpreter.run(program);

