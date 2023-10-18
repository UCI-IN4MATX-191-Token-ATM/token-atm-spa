import { Injectable } from '@angular/core';
import * as CSVParse from 'papaparse';
import ZipFile from 'jszip';
import sanitizeFileName from 'sanitize-filename';
import { formatISO } from 'date-fns';

type Fixes = { prefix: string; suffix: string };

@Injectable({
    providedIn: 'root'
})
export class CSVsService {
    private baselineParseConfig = {
        skipEmptyLines: true,
        dynamicTyping: false
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    // TODO: - Parsing from & Unparsing to Excel formatted CSVs (https://www.papaparse.com/faq#encoding)
    //       - Expose Parser Errors & Meta info (`results.errors` & `results.meta`)
    //       - Update parser to use a stream to parse row by row (makes progress indeterminate)

    async parseCSV(file: File, options?: object) {
        let promiseResolve: (results: CSVParse.ParseResult<unknown>) => void;
        const promise = new Promise<CSVParse.ParseResult<unknown>>((resolve) => {
            promiseResolve = resolve;
        });
        CSVParse.parse(file, {
            ...this.baselineParseConfig,
            ...options,
            complete: async (results) => {
                promiseResolve(results);
            }
        });
        return promise;
    }

    public async makeFile(
        namesAndContent: Map<string, Record<string, string>[]>,
        fixes?: Fixes,
        zipName?: string,
        zipFixes?: Fixes
    ): Promise<File> {
        if (namesAndContent.size === 0) {
            throw new Error('No filename or data provided to make a file');
        } else if (namesAndContent.size === 1 && zipName === undefined && zipFixes === undefined) {
            return this.makeCSVFile(namesAndContent.entries().next().value, fixes);
        } else {
            return await this.makeZipFile(namesAndContent, fixes, zipName, zipFixes);
        }
    }

    private makeCSVFile(nameAndContent: [string, Record<string, string>[]], fixes?: Fixes) {
        const [filename, data] = nameAndContent;
        return new File(
            [CSVParse.unparse(data)],
            sanitizeFileName(this.filenameTemplate(filename, new Date(), fixes) + '.csv'),
            {
                type: 'text/csv;charset=utf-8;'
            }
        );
    }

    private async makeZipFile(
        namesAndContent: Map<string, Record<string, string>[]>,
        fixes?: Fixes,
        zipName?: string,
        zipFixes?: Fixes
    ) {
        const zipFile = new ZipFile();
        const generationDate = new Date();
        for (const [filename, data] of namesAndContent.entries()) {
            zipFile.file(
                sanitizeFileName(this.filenameTemplate(filename, generationDate, fixes) + '.csv'),
                CSVParse.unparse(data)
            );
        }
        // TODO: Call any functions to add more files here. E.g., Readme or Data Dictionary generator
        return new File(
            [await zipFile.generateAsync({ type: 'blob' })],
            sanitizeFileName(
                this.filenameTemplate(
                    zipName ?? '',
                    generationDate,
                    zipFixes
                        ? zipFixes
                        : {
                              prefix: 'Token-ATM-Export',
                              suffix: ''
                          }
                ) + '.zip'
            ),
            {
                type: 'application/zip'
            }
        );
    }

    private filenameTemplate(filename: string, date?: Date, fixes?: Fixes): string {
        const taggedDate = date ?? new Date();
        return [fixes?.prefix, filename, fixes?.suffix, formatISO(taggedDate, { format: 'basic' })]
            .filter((x) => x)
            .join('_');
    }
}
