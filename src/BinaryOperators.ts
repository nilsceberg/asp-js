export type BinaryFunction = (left: any, right: any) => any;

export const Operators: {[operator: string]: BinaryFunction}[] = [
	{
		"or": (a, b) => a || b,
	},
	{
		"and": (a, b) => a || b,
	},
	{
		"=": (a, b) => a == b,
	},
	{
		"+": (a, b) => a + b,
		"-": (a, b) => a - b,
	},
	{
		"*": (a, b) => a * b,
		"/": (a, b) => a / b,
	},
]

