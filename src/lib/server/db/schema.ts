import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core';

export const borrowStatusEnum = pgEnum('borrow_status', ['borrowed', 'returned', 'overdue']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'transfer', 'ewallet']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed']);
export const fineStatusEnum = pgEnum('fine_status', ['none', 'unpaid', 'paid']);

function createdAtColumn() {
  return timestamp('created_at', { mode: 'string', withTimezone: true }).defaultNow().notNull();
}

function updatedAtColumn() {
  return timestamp('updated_at', { mode: 'string', withTimezone: true }).defaultNow().notNull();
}

export const booksTable = pgTable(
  'books',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    author: text('author').notNull(),
    isbn: text('isbn').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    coverUrl: text('cover_url').notNull().default(''),
    price: integer('price').notNull().default(0),
    stock: integer('stock').notNull().default(0),
    borrowedCount: integer('borrowed_count').notNull().default(0),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    uniqueIndex('books_isbn_unique').on(table.isbn),
    index('books_title_idx').on(table.title),
    index('books_category_idx').on(table.category),
    check('books_price_nonnegative', sql`${table.price} >= 0`),
    check('books_stock_nonnegative', sql`${table.stock} >= 0`),
    check('books_borrowed_count_nonnegative', sql`${table.borrowedCount} >= 0`)
  ]
).enableRLS();

export const customersTable = pgTable(
  'customers',
  {
    email: text('email').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [index('customers_username_idx').on(table.username)]
).enableRLS();

export const borrowRecordsTable = pgTable(
  'borrow_records',
  {
    id: text('id').primaryKey(),
    bookId: text('book_id').references(() => booksTable.id, { onDelete: 'set null' }),
    bookTitle: text('book_title').notNull(),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    borrowDate: date('borrow_date').notNull(),
    returnDate: date('return_date'),
    dueDate: date('due_date').notNull(),
    lateDays: integer('late_days').notNull().default(0),
    fineAmount: integer('fine_amount').notNull().default(0),
    fineStatus: fineStatusEnum('fine_status').notNull().default('none'),
    borrowPrice: integer('borrow_price').notNull().default(0),
    paymentId: text('payment_id'),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('paid'),
    paidAt: date('paid_at'),
    status: borrowStatusEnum('status').notNull().default('borrowed'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => [
    index('borrow_records_book_id_idx').on(table.bookId),
    index('borrow_records_customer_email_idx').on(table.customerEmail),
    index('borrow_records_status_idx').on(table.status),
    index('borrow_records_active_idx').on(table.dueDate).where(sql`${table.status} in ('borrowed', 'overdue')`),
    check('borrow_records_late_days_nonnegative', sql`${table.lateDays} >= 0`),
    check('borrow_records_fine_amount_nonnegative', sql`${table.fineAmount} >= 0`),
    check('borrow_records_borrow_price_nonnegative', sql`${table.borrowPrice} >= 0`)
  ]
).enableRLS();

export type BookRow = typeof booksTable.$inferSelect;
export type NewBookRow = typeof booksTable.$inferInsert;
export type CustomerRow = typeof customersTable.$inferSelect;
export type NewCustomerRow = typeof customersTable.$inferInsert;
export type BorrowRecordRow = typeof borrowRecordsTable.$inferSelect;
export type NewBorrowRecordRow = typeof borrowRecordsTable.$inferInsert;
