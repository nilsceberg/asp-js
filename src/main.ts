import { InputStream } from "./InputStream";
import { TokenStream } from "./TokenStream";
import { Parser, ast } from "./Parser";

const input = new InputStream("test.vbs");
const tokens = new TokenStream(input);
const parser = new Parser(tokens);

//let bucket;
//while ((bucket = tokens.next()) !== null) {
//	console.log(bucket);
//}

console.log(parser.parse());

console.log("OpenVBS v1.0.0");
