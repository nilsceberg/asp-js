import { InputStream } from "./InputStream";

import { readFileSync } from "fs";

export class StringInputStream extends InputStream {
	constructor(content: string, filename: string = "<string>") {
		super(filename, content);
	}

	protected openInclude(filename: string): InputStream {
		return new StringInputStream("");
	}
}

