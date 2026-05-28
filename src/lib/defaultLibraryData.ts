import type { BookData, BorrowRecordData, CustomerData, LibraryData } from './types';

export const DEFAULT_BOOKS: BookData[] = [];

export const DEFAULT_CUSTOMERS: CustomerData[] = [];

export const DEFAULT_BORROW_RECORDS: BorrowRecordData[] = [];

export function createDefaultLibraryData(): LibraryData {
  return {
    books: DEFAULT_BOOKS.map((book) => ({ ...book })),
    customers: DEFAULT_CUSTOMERS.map((customer) => ({ ...customer })),
    borrowRecords: DEFAULT_BORROW_RECORDS.map((record) => ({ ...record }))
  };
}
