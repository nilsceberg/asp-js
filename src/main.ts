import { InputStream } from "./InputStream";
import { TokenStream } from "./TokenStream";

const input = new InputStream("test.vbs");
const tokens = new TokenStream(input);

let bucket;
while ((bucket = tokens.next()) !== null) {
	console.log(bucket);
}

console.log("OpenVBS v1.0.0");
