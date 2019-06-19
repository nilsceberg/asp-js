import { SourcePointer, StringSource } from "parser-monad";

export const not = (f: (x: any) => boolean) => (x: any) => !f(x);

export function strEqual(a: string, b: string): boolean {
    return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}

export function src(s: string): SourcePointer {
	return new SourcePointer(new StringSource(s));
}
