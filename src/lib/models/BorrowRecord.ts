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

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDaysToISODate(date: string, days: number): string {
  return new Date(parseISODateToUTC(date) + days * DAY_IN_MS).toISOString().split('T')[0];
}

function parseISODateToUTC(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return Date.UTC(1970, 0, 1);
  return Date.UTC(year, month - 1, day);
}

function dayDiff(fromDate: string, toDate: string): number {
  const diff = Math.floor((parseISODateToUTC(toDate) - parseISODateToUTC(fromDate)) / DAY_IN_MS);
  return Number.isFinite(diff) ? diff : 0;
}

function createRecordId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class BorrowRecord {
  private _id: string;
  private _bookId: string;
  private _bookTitle: string;
  private _customerName: string;
  private _customerEmail: string;
  private _borrowDate: string;
  private _returnDate: string | null;
  private _dueDate: string;
  private _lateDays: number;
  private _fineAmount: number;
  private _fineStatus: FineStatus;
  private _borrowPrice: number;
  private _paymentId: string | null;
  private _paymentMethod: PaymentMethod;
  private _paymentStatus: PaymentStatus;
  private _paidAt: string | null;
  private _status: Exclude<BorrowStatus, 'overdue'>;

  constructor(data: BorrowRecordData) {
    const borrowDate = data.borrowDate || todayISO();
    const dueDate = data.dueDate || addDaysToISODate(borrowDate, DEFAULT_BORROW_DAYS);
    const returnDate = data.returnDate ?? null;
    const computedLateDays = Math.max(0, dayDiff(dueDate, returnDate || todayISO()));
    const lateDays = data.lateDays ?? (returnDate ? computedLateDays : 0);
    const fineAmount = data.fineAmount ?? lateDays * FINE_PER_DAY;

    this._id = data.id;
    this._bookId = data.bookId;
    this._bookTitle = data.bookTitle;
    this._customerName = data.customerName;
    this._customerEmail = data.customerEmail;
    this._borrowDate = borrowDate;
    this._returnDate = returnDate;
    this._dueDate = dueDate;
    this._lateDays = Math.max(0, Number(lateDays) || 0);
    this._fineAmount = Math.max(0, Math.round(Number(fineAmount) || 0));
    this._fineStatus = data.fineStatus ?? (this._fineAmount > 0 ? 'unpaid' : 'none');
    this._borrowPrice = Math.max(0, Math.round(Number(data.borrowPrice) || 0));
    this._paymentId = data.paymentId ?? null;
    this._paymentMethod = data.paymentMethod ?? 'cash';
    this._paymentStatus = data.paymentStatus ?? 'paid';
    this._paidAt = data.paidAt ?? data.borrowDate ?? null;
    this._status = returnDate || data.status === 'returned' ? 'returned' : 'borrowed';
  }

  // --- Encapsulation: Read-only getters ---
  get id(): string { return this._id; }
  get bookId(): string { return this._bookId; }
  get bookTitle(): string { return this._bookTitle; }
  get customerName(): string { return this._customerName; }
  get customerEmail(): string { return this._customerEmail; }
  get borrowDate(): string { return this._borrowDate; }
  get returnDate(): string | null { return this._returnDate; }
  get dueDate(): string { return this._dueDate; }
  get borrowPrice(): number { return this._borrowPrice; }
  get paymentId(): string | null { return this._paymentId; }
  get paymentMethod(): PaymentMethod { return this._paymentMethod; }
  get paymentStatus(): PaymentStatus { return this._paymentStatus; }
  get paidAt(): string | null { return this._paidAt; }

  get status(): BorrowStatus {
    if (this._status === 'returned') return 'returned';
    return this.isOverdue ? 'overdue' : 'borrowed';
  }

  get lateDays(): number {
    if (this._status === 'returned') return this._lateDays;
    return this.calculateLateDays();
  }

  get fineAmount(): number {
    if (this._status === 'returned') return this._fineAmount;
    return this.calculateFine();
  }

  get fineStatus(): FineStatus {
    if (this._fineStatus !== 'none') return this._fineStatus;
    return this.fineAmount > 0 ? 'unpaid' : 'none';
  }

  get isBorrowed(): boolean {
    return this._status === 'borrowed';
  }

  get isOverdue(): boolean {
    return this._status === 'borrowed' && this.calculateLateDays() > 0;
  }

  get isPaymentPaid(): boolean {
    return this._paymentStatus === 'paid';
  }

  calculateLateDays(returnDate = todayISO()): number {
    return Math.max(0, dayDiff(this._dueDate, returnDate));
  }

  calculateFine(returnDate = todayISO()): number {
    return this.calculateLateDays(returnDate) * FINE_PER_DAY;
  }

  markReturned(returnDate = todayISO()): boolean {
    if (this._status === 'returned') return false;

    this._status = 'returned';
    this._returnDate = returnDate;
    this._lateDays = this.calculateLateDays(returnDate);
    this._fineAmount = this.calculateFine(returnDate);
    this._fineStatus = this._fineAmount > 0 ? 'unpaid' : 'none';

    return true;
  }

  markFinePaid(): boolean {
    if (this.fineAmount <= 0 || this.fineStatus !== 'unpaid') return false;
    this._fineStatus = 'paid';
    return true;
  }

  toJSON(): BorrowRecordData {
    return {
      id: this._id,
      bookId: this._bookId,
      bookTitle: this._bookTitle,
      customerName: this._customerName,
      customerEmail: this._customerEmail,
      borrowDate: this._borrowDate,
      returnDate: this._returnDate,
      dueDate: this._dueDate,
      lateDays: this.lateDays,
      fineAmount: this.fineAmount,
      fineStatus: this.fineStatus,
      borrowPrice: this._borrowPrice,
      paymentId: this._paymentId,
      paymentMethod: this._paymentMethod,
      paymentStatus: this._paymentStatus,
      paidAt: this._paidAt,
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
