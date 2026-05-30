import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  booksTable,
  borrowRecordsTable,
  customersTable,
  type NewBookRow,
  type NewBorrowRecordRow,
  type NewCustomerRow
} from '../src/lib/server/db/schema';
import type { BookData, BorrowRecordData, CustomerData, LibraryData } from '../src/lib/types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : 0;
}

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

function emptyLibraryData(): LibraryData {
  return {
    books: [],
    customers: [],
    borrowRecords: []
  };
}

function normalizeLibraryData(value: unknown): LibraryData {
  if (!isObject(value)) {
    return emptyLibraryData();
  }

  return {
    books: Array.isArray(value.books) ? (value.books as BookData[]) : [],
    customers: Array.isArray(value.customers) ? (value.customers as CustomerData[]) : [],
    borrowRecords: Array.isArray(value.borrowRecords)
      ? (value.borrowRecords as BorrowRecordData[])
      : []
  };
}

async function readSeedData(): Promise<LibraryData> {
  try {
    const file = await readFile(join(process.cwd(), 'data', 'library.json'), 'utf8');
    return normalizeLibraryData(JSON.parse(file));
  } catch (error) {
    if (isObject(error) && error.code !== 'ENOENT') {
      console.warn('Gagal membaca data/library.json, seed memakai data default kosong.');
    }

    return emptyLibraryData();
  }
}

function bookDataToRow(book: BookData): NewBookRow {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    description: book.description,
    category: book.category,
    coverUrl: book.coverUrl,
    price: normalizeNumber(book.price),
    stock: normalizeNumber(book.stock),
    borrowedCount: normalizeNumber(book.borrowedCount)
  };
}

function customerDataToRow(customer: CustomerData): NewCustomerRow {
  return {
    email: customer.email,
    username: customer.username,
    passwordHash: customer.password ?? null
  };
}

function borrowRecordDataToRow(record: BorrowRecordData, bookIds: Set<string>): NewBorrowRecordRow {
  return {
    id: record.id,
    bookId: record.bookId && bookIds.has(record.bookId) ? record.bookId : null,
    bookTitle: record.bookTitle,
    customerName: record.customerName,
    customerEmail: record.customerEmail,
    borrowDate: record.borrowDate,
    returnDate: emptyToNull(record.returnDate),
    dueDate: record.dueDate ?? record.borrowDate,
    lateDays: normalizeNumber(record.lateDays),
    fineAmount: normalizeNumber(record.fineAmount),
    fineStatus: record.fineStatus ?? 'none',
    borrowPrice: normalizeNumber(record.borrowPrice),
    paymentId: emptyToNull(record.paymentId),
    paymentMethod: record.paymentMethod ?? 'cash',
    paymentStatus: record.paymentStatus ?? 'paid',
    paidAt: emptyToNull(record.paidAt),
    status: record.status
  };
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL belum diatur. Isi .env dengan connection string Supabase Postgres.');
}

const client = postgres(databaseUrl, { prepare: false });
const db = drizzle(client);
const data = await readSeedData();

await db.transaction(async (tx) => {
  await tx.delete(borrowRecordsTable);
  await tx.delete(booksTable);
  await tx.delete(customersTable);

  if (data.books.length > 0) {
    await tx.insert(booksTable).values(data.books.map(bookDataToRow));
  }

  if (data.customers.length > 0) {
    await tx.insert(customersTable).values(data.customers.map(customerDataToRow));
  }

  if (data.borrowRecords.length > 0) {
    const bookIds = new Set(data.books.map((book) => book.id));
    await tx
      .insert(borrowRecordsTable)
      .values(data.borrowRecords.map((record) => borrowRecordDataToRow(record, bookIds)));
  }
});

await client.end();

console.log(
  `Seed selesai: ${data.books.length} buku, ${data.customers.length} customer, ${data.borrowRecords.length} transaksi.`
);
