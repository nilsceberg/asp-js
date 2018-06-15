export interface Bucket {
	content: any;
	line: number;
	position: number;
	filename: string;
}

export interface Stream {
	next(): Bucket;
	peek(): Bucket;
}

