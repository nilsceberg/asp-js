import { Bucket } from "./parser/Stream";
import { ast } from "./parser/AST";

function error(label: string, bucket: Bucket, message: string) {
	throw new Error(`${label} error in ${bucket.filename} at line ${bucket.line}, column ${bucket.position}: ${message}`);
}

export function syntaxError(bucket: Bucket, message: string) {
	error("runtime", bucket, message);
}

export function runtimeError(node: ast.Node, message: string) {
	error("runtime", node.bucket, message);
}
