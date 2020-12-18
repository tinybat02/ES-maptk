declare module '*.png';
declare module '*.svg';

declare module 'use-csv-downloader' {
  export default (parseOpts: { [key: string]: string }) => (data: Array<CSVRow>, filename: string): void => {};
}
