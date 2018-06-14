import { InputStream } from "./InputStream";
import { TokenStream } from "./TokenStream";
import { Parser, ast } from "./Parser";

import * as util from "util";

const input = new InputStream("test.vbs");
const tokens = new TokenStream(input);
const parser = new Parser(tokens);

//let bucket;
//while ((bucket = tokens.next()) !== null) {
//	console.log(bucket);
//}

console.log(util.inspect(parser.parse(), {
	depth: null,
	colors: true,
}));

console.log("OpenVBS v1.0.0");
