import { Interpreter, Context, Box } from "./Interpreter";

import * as util from "util";

console.log("OpenVBS v1.0.0");

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

interpreter.runFile("test.vbs");

