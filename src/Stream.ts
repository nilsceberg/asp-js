export interface Bucket {
	content: string;
	line: number;
	position: number;
	filename: string;
}

export interface Stream {
	next(): Bucket;
	peek(): Bucket;
}

