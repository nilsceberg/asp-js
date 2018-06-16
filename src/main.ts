import { Interpreter, Context, Box } from "./Interpreter";

import * as util from "util";
import * as process from "process";

console.log("ASP.JS v1.0.0");

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

const filename = process.argv[2];
if (!filename) {
	console.log("Please specify filename.");
}
else {
	interpreter.runFile(filename);
}

