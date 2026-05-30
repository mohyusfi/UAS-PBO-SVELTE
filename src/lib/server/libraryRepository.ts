import { asc, eq, sql } from 'drizzle-orm';

import type { BookData, BorrowRecordData, CustomerData, LibraryData } from '$lib/types';

import { assertDatabaseConfigured, db } from './db/client';
import {
  booksTable,
  borrowRecordsTable,
  customersTable,
  type BookRow,
  type BorrowRecordRow,
  type CustomerRow,
  type NewBookRow,
  type NewBorrowRecordRow,
  type NewCustomerRow
} from './db/schema';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function normalizeNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : 0;
}

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

function bookRowToData(row: BookRow): BookData {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    description: row.description,
    category: row.category,
    coverUrl: row.coverUrl,
    price: row.price,
    stock: row.stock,
    borrowedCount: row.borrowedCount
  };
}

function customerRowToData(row: CustomerRow): CustomerData {
  return {
    username: row.username,
    email: row.email,
    password: row.passwordHash ?? undefined
  };
}

function borrowRecordRowToData(row: BorrowRecordRow): BorrowRecordData {
  return {
    id: row.id,
    bookId: row.bookId ?? '',
    bookTitle: row.bookTitle,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    borrowDate: row.borrowDate,
    returnDate: row.returnDate,
    dueDate: row.dueDate,
    lateDays: row.lateDays,
    fineAmount: row.fineAmount,
    fineStatus: row.fineStatus,
    borrowPrice: row.borrowPrice,
    paymentId: row.paymentId,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    paidAt: row.paidAt,
    status: row.status
  };
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

async function getBookIds(tx: Transaction): Promise<Set<string>> {
  const rows = await tx.select({ id: booksTable.id }).from(booksTable);
  return new Set(rows.map((row) => row.id));
}

async function upsertBook(book: BookData): Promise<void> {
  const row = bookDataToRow(book);
  await db
    .insert(booksTable)
    .values(row)
    .onConflictDoUpdate({
      target: booksTable.id,
      set: {
        title: sql`excluded.title`,
        author: sql`excluded.author`,
        isbn: sql`excluded.isbn`,
        description: sql`excluded.description`,
        category: sql`excluded.category`,
        coverUrl: sql`excluded.cover_url`,
        price: sql`excluded.price`,
        stock: sql`excluded.stock`,
        borrowedCount: sql`excluded.borrowed_count`,
        updatedAt: sql`now()`
      }
    });
}

async function upsertCustomer(customer: CustomerData): Promise<void> {
  const row = customerDataToRow(customer);
  await db
    .insert(customersTable)
    .values(row)
    .onConflictDoUpdate({
      target: customersTable.email,
      set: {
        username: sql`excluded.username`,
        passwordHash: sql`excluded.password_hash`,
        updatedAt: sql`now()`
      }
    });
}

async function updateBookInTransaction(tx: Transaction, book: BookData): Promise<void> {
  await tx
    .update(booksTable)
    .set({
      ...bookDataToRow(book),
      updatedAt: sql`now()`
    })
    .where(eq(booksTable.id, book.id));
}

async function upsertBorrowRecordInTransaction(
  tx: Transaction,
  record: BorrowRecordData
): Promise<void> {
  const bookIds = await getBookIds(tx);
  const row = borrowRecordDataToRow(record, bookIds);

  await tx
    .insert(borrowRecordsTable)
    .values(row)
    .onConflictDoUpdate({
      target: borrowRecordsTable.id,
      set: {
        bookId: sql`excluded.book_id`,
        bookTitle: sql`excluded.book_title`,
        customerName: sql`excluded.customer_name`,
        customerEmail: sql`excluded.customer_email`,
        borrowDate: sql`excluded.borrow_date`,
        returnDate: sql`excluded.return_date`,
        dueDate: sql`excluded.due_date`,
        lateDays: sql`excluded.late_days`,
        fineAmount: sql`excluded.fine_amount`,
        fineStatus: sql`excluded.fine_status`,
        borrowPrice: sql`excluded.borrow_price`,
        paymentId: sql`excluded.payment_id`,
        paymentMethod: sql`excluded.payment_method`,
        paymentStatus: sql`excluded.payment_status`,
        paidAt: sql`excluded.paid_at`,
        status: sql`excluded.status`,
        updatedAt: sql`now()`
      }
    });
}

export async function readLibraryData(): Promise<LibraryData> {
  assertDatabaseConfigured();

  const [books, customers, borrowRecords] = await Promise.all([
    db.select().from(booksTable).orderBy(asc(booksTable.title)),
    db.select().from(customersTable).orderBy(asc(customersTable.username)),
    db.select().from(borrowRecordsTable).orderBy(asc(borrowRecordsTable.borrowDate))
  ]);

  return {
    books: books.map(bookRowToData),
    customers: customers.map(customerRowToData),
    borrowRecords: borrowRecords.map(borrowRecordRowToData)
  };
}

export async function saveBook(book: BookData): Promise<BookData> {
  assertDatabaseConfigured();
  await upsertBook(book);
  return book;
}

export async function deleteBook(id: string): Promise<void> {
  assertDatabaseConfigured();
  await db.delete(booksTable).where(eq(booksTable.id, id));
}

export async function saveCustomer(customer: CustomerData): Promise<CustomerData> {
  assertDatabaseConfigured();
  await upsertCustomer(customer);
  return customer;
}

export async function saveBorrowRecord(
  record: BorrowRecordData,
  book?: BookData
): Promise<BorrowRecordData> {
  assertDatabaseConfigured();
  await db.transaction(async (tx) => {
    if (book) {
      await updateBookInTransaction(tx, book);
    }
    await upsertBorrowRecordInTransaction(tx, record);
  });

  return record;
}
