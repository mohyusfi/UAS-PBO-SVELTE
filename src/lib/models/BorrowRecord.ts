import type {
  BorrowRecordData,
  BorrowStatus,
  FineStatus,
  PaymentData,
  PaymentMethod,
  PaymentStatus
} from '../types';

export const DEFAULT_BORROW_DAYS = 7;
export const FINE_PER_DAY = 2000;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type BorrowRecordState = {
  id: string;
  bookId: string;
  bookTitle: string;
  customerName: string;
  customerEmail: string;
  borrowDate: string;
  returnDate: string | null;
  dueDate: string;
  lateDays: number;
  fineAmount: number;
  fineStatus: FineStatus;
  borrowPrice: number;
  paymentId: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  status: Exclude<BorrowStatus, 'overdue'>;
};

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDaysToISODate(date: string, days: number): string {
  return new Date(parseISODateToUTC(date) + days * DAY_IN_MS).toISOString().split('T')[0];
}

function parseISODateToUTC(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return Date.UTC(1970, 0, 1);
  }
  return Date.UTC(year, month - 1, day);
}

function dayDiff(fromDate: string, toDate: string): number {
  const diff = Math.floor((parseISODateToUTC(toDate) - parseISODateToUTC(fromDate)) / DAY_IN_MS);
  return Number.isFinite(diff) ? diff : 0;
}

function normalizeNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : 0;
}

function createRecordId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class BorrowRecord {
  private data: BorrowRecordState;

  constructor(data: BorrowRecordData) {
    const borrowDate = data.borrowDate || todayISO();
    const dueDate = data.dueDate || addDaysToISODate(borrowDate, DEFAULT_BORROW_DAYS);
    const returnDate = data.returnDate ?? null;
    const lateDays = data.lateDays ?? (returnDate ? Math.max(0, dayDiff(dueDate, returnDate)) : 0);
    const fineAmount = data.fineAmount ?? lateDays * FINE_PER_DAY;

    this.data = {
      id: data.id,
      bookId: data.bookId,
      bookTitle: data.bookTitle,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      borrowDate,
      returnDate,
      dueDate,
      lateDays: normalizeNumber(lateDays),
      fineAmount: normalizeNumber(fineAmount),
      fineStatus: data.fineStatus ?? (fineAmount > 0 ? 'unpaid' : 'none'),
      borrowPrice: normalizeNumber(data.borrowPrice),
      paymentId: data.paymentId ?? null,
      paymentMethod: data.paymentMethod ?? 'cash',
      paymentStatus: data.paymentStatus ?? 'paid',
      paidAt: data.paidAt ?? data.borrowDate ?? null,
      status: returnDate || data.status === 'returned' ? 'returned' : 'borrowed'
    };
  }

  get id(): string { return this.data.id; }
  get bookId(): string { return this.data.bookId; }
  get bookTitle(): string { return this.data.bookTitle; }
  get customerName(): string { return this.data.customerName; }
  get customerEmail(): string { return this.data.customerEmail; }
  get borrowDate(): string { return this.data.borrowDate; }
  get returnDate(): string | null { return this.data.returnDate; }
  get dueDate(): string { return this.data.dueDate; }
  get borrowPrice(): number { return this.data.borrowPrice; }
  get paymentId(): string | null { return this.data.paymentId; }
  get paymentMethod(): PaymentMethod { return this.data.paymentMethod; }
  get paymentStatus(): PaymentStatus { return this.data.paymentStatus; }
  get paidAt(): string | null { return this.data.paidAt; }

  get status(): BorrowStatus {
    if (this.data.status === 'returned') return 'returned';
    return this.isOverdue ? 'overdue' : 'borrowed';
  }

  get lateDays(): number {
    return this.data.status === 'returned' ? this.data.lateDays : this.calculateLateDays();
  }

  get fineAmount(): number {
    return this.data.status === 'returned' ? this.data.fineAmount : this.calculateFine();
  }

  get fineStatus(): FineStatus {
    if (this.data.fineStatus !== 'none') return this.data.fineStatus;
    return this.fineAmount > 0 ? 'unpaid' : 'none';
  }

  get isBorrowed(): boolean {
    return this.data.status === 'borrowed';
  }

  get isOverdue(): boolean {
    return this.data.status === 'borrowed' && this.calculateLateDays() > 0;
  }

  get isPaymentPaid(): boolean {
    return this.data.paymentStatus === 'paid';
  }

  calculateLateDays(returnDate = todayISO()): number {
    return Math.max(0, dayDiff(this.data.dueDate, returnDate));
  }

  calculateFine(returnDate = todayISO()): number {
    return this.calculateLateDays(returnDate) * FINE_PER_DAY;
  }

  markReturned(returnDate = todayISO()): boolean {
    if (this.data.status === 'returned') return false;

    this.data.status = 'returned';
    this.data.returnDate = returnDate;
    this.data.lateDays = this.calculateLateDays(returnDate);
    this.data.fineAmount = this.calculateFine(returnDate);
    this.data.fineStatus = this.data.fineAmount > 0 ? 'unpaid' : 'none';

    return true;
  }

  markFinePaid(): boolean {
    if (this.fineAmount <= 0 || this.fineStatus !== 'unpaid') return false;

    this.data.fineStatus = 'paid';
    return true;
  }

  toJSON(): BorrowRecordData {
    return {
      ...this.data,
      lateDays: this.lateDays,
      fineAmount: this.fineAmount,
      fineStatus: this.fineStatus,
      status: this.status
    };
  }

  static fromJSON(data: BorrowRecordData): BorrowRecord {
    return new BorrowRecord(data);
  }

  static create(
    bookId: string,
    bookTitle: string,
    customerName: string,
    customerEmail: string,
    payment: PaymentData
  ): BorrowRecord {
    const borrowDate = todayISO();

    return new BorrowRecord({
      id: createRecordId(),
      bookId,
      bookTitle,
      customerName,
      customerEmail,
      borrowDate,
      returnDate: null,
      dueDate: addDaysToISODate(borrowDate, DEFAULT_BORROW_DAYS),
      lateDays: 0,
      fineAmount: 0,
      fineStatus: 'none',
      borrowPrice: payment.amount,
      paymentId: payment.id,
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      paidAt: payment.paidAt,
      status: 'borrowed'
    });
  }
}
