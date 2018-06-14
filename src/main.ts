import { InputStream } from "./InputStream";
import { TokenStream } from "./TokenStream";
import { Parser } from "./Parser";
import { Interpreter, Context, Box } from "./Interpreter";

import * as util from "util";

const input = new InputStream("test.vbs");
const tokens = new TokenStream(input);
const parser = new Parser(tokens);

//let bucket;
//while ((bucket = tokens.next()) !== null) {
//	console.log(bucket);
//}

const program = parser.parse();

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
	})
});
interpreter.run(program);


console.log("OpenVBS v1.0.0");
