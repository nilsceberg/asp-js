export interface Bucket {
	content: string;
	line: number;
	position: number;
}

export interface Stream {
	next(): Bucket;
	peek(): Bucket;
}

