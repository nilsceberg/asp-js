import { Script } from "./NewInterpreter";
import { StringSource } from "parser-monad";

describe("script", () => {
	test("parse", () => {
		const script = new Script;
		script.parse(new StringSource(`
		x = 123\n
		if x > 100 then\n
			response.write "hello!"\n
		end if\n
		dim x\n
		`))
	});
});
