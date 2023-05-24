import type { AxiosResponse } from 'axios';

export class PaginatedView<T> implements Iterable<T> {
    private data: T[];
    private prevURL?: string;
    private nextURL?: string;
    private requestHandler: (url: string) => Promise<AxiosResponse>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private dataProcessor: (data: any) => T[];

    constructor(
        response: AxiosResponse,
        requestHandler: (url: string) => Promise<AxiosResponse>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataProcessor: (data: any) => T[]
    ) {
        this.data = dataProcessor(response.data);
        this.extractURLs(response);
        this.requestHandler = requestHandler;
        this.dataProcessor = dataProcessor;
    }

    private extractURLs(response: AxiosResponse): void {
        const linkHeader = response.headers['link'];
        this.prevURL = undefined;
        this.nextURL = undefined;
        if (!linkHeader) return;
        for (const link of (linkHeader as string).split(',')) {
            if (link.endsWith('rel="next"')) {
                const rawNextLink = link.split(';')[0];
                this.nextURL = rawNextLink?.substring(1, rawNextLink.length - 1);
            } else if (link.endsWith('rel="prev"')) {
                const rawPrevLink = link.split(';')[0];
                this.prevURL = rawPrevLink?.substring(1, rawPrevLink.length - 1);
            }
        }
    }

    public hasPrevPage(): boolean {
        return this.prevURL != undefined;
    }

    public async prev(): Promise<void> {
        if (!this.prevURL) return;
        const response = await this.requestHandler(this.prevURL);
        this.data = this.dataProcessor(response.data);
        this.extractURLs(response);
    }

    public hasNextPage(): boolean {
        return this.nextURL != undefined;
    }

    public async next(): Promise<void> {
        if (!this.nextURL) return;
        const response = await this.requestHandler(this.nextURL);
        this.data = this.dataProcessor(response.data);
        this.extractURLs(response);
    }

    private *generator(): Iterator<T> {
        for (const entry of this.data) {
            yield entry;
        }
    }

    public [Symbol.iterator]() {
        return this.generator();
    }
}

// class PaginatedView {
//     private token: string; // Canvas API access token
//     private pageSize: number; // Number of students per page

//     constructor(token: string, pageSize: number) {
//         this.token = token;
//         this.pageSize = pageSize;
//     }

//     private async requestHandler(url: string): Promise<AxiosResponse> {
//         const response = await axios.get(url, {
//             headers: {
//                 Authorization: `Bearer ${this.token}`
//             }
//         });
//         return response;
//     }
//     //email
//     private processStudentData(data: any): Student[] {
//         return data.map((student: any) => ({
//             id: student.id,
//             name: student.name
//         }));
//     }

//     public async getStudentNames(pageCount: number): Promise<string[]> {
//         const url = 'https://canvas-api-url/api/students';
//         const paginatedResult = new PaginatedResult<Student>(
//             await this.requestHandler(url),
//             this.requestHandler.bind(this),
//             this.processStudentData
//         );

//         const studentNames: string[] = [];
//         let pageCountRemaining = pageCount;

//         for await (const student of paginatedResult) {
//             studentNames.push(student.name);

//             pageCountRemaining--;
//             if (pageCountRemaining === 0) {
//                 break;
//             }
//         }

//         return studentNames;
//     }
// }

// Usage example
// const canvasToken = 'YOUR_CANVAS_API_TOKEN';
// const pageSize = 50;
// const pageCount = 3;

// const paginatedView = new PaginatedView(canvasTokenconst paginatedView = new PaginatedView(canvasToken, pageSize);
// paginatedView.getStudentNames(pageCount)
//   .then((studentNames) => {
//     console.log(studentNames);
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });
