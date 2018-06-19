import { InputStream } from "./InputStream";

import { readFileSync } from "fs";

export class FileInputStream extends InputStream {
	constructor(filename: string) {
		super(filename, readFileSync(filename, "utf-8"));
	}

	protected openInclude(filename: string): InputStream {
		return new FileInputStream(filename);
	}
}

