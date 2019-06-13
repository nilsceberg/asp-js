export const not = (f: (x: any) => boolean) => (x: any) => !f(x);

export function strEqual(a: string, b: string): boolean {
    return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}
