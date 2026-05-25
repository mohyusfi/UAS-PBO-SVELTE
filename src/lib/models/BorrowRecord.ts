// ============================================================
// BORROW_RECORD.ts — Encapsulation
// ============================================================
// Private fields, status hanya bisa diubah lewat markReturned().
// Tidak bisa set status = 'returned' langsung dari luar.
// ============================================================

import type { BorrowRecordData } from '../types';

export class BorrowRecord {
  private _id: string;
  private _bookId: string;
  private _bookTitle: string;
  private _customerName: string;
  private _customerEmail: string;
  private _borrowDate: string;
  private _returnDate: string | null;
  private _status: 'borrowed' | 'returned';

  constructor(data: BorrowRecordData) {
    this._id = data.id;
    this._bookId = data.bookId;
    this._bookTitle = data.bookTitle;
    this._customerName = data.customerName;
    this._customerEmail = data.customerEmail;
    this._borrowDate = data.borrowDate;
    this._returnDate = data.returnDate;
    this._status = data.status;
  }

  // --- Encapsulation: Read-only getters ---
  get id(): string { return this._id; }
  get bookId(): string { return this._bookId; }
  get bookTitle(): string { return this._bookTitle; }
  get customerName(): string { return this._customerName; }
  get customerEmail(): string { return this._customerEmail; }
  get borrowDate(): string { return this._borrowDate; }
  get returnDate(): string | null { return this._returnDate; }
  get status(): 'borrowed' | 'returned' { return this._status; }

  /** Cek apakah record ini masih aktif dipinjam */
  get isBorrowed(): boolean {
    return this._status === 'borrowed';
  }

  // --- Encapsulation: Controlled mutation ---

  /**
   * Tandai buku sudah dikembalikan. 
   * Hanya bisa dilakukan sekali (jika masih berstatus 'borrowed').
   */
  markReturned(): boolean {
    if (this._status === 'returned') return false;
    this._status = 'returned';
    this._returnDate = new Date().toISOString().split('T')[0];
    return true;
  }

  /**
   * Serialize ke plain object untuk localStorage.
   */
  toJSON(): BorrowRecordData {
    return {
      id: this._id,
      bookId: this._bookId,
      bookTitle: this._bookTitle,
      customerName: this._customerName,
      customerEmail: this._customerEmail,
      borrowDate: this._borrowDate,
      returnDate: this._returnDate,
      status: this._status
    };
  }

  /**
   * Factory method — buat instance dari plain data.
   */
  static fromJSON(data: BorrowRecordData): BorrowRecord {
    return new BorrowRecord(data);
  }

  /**
   * Factory method — buat record peminjaman baru.
   */
  static create(bookId: string, bookTitle: string, customerName: string, customerEmail: string): BorrowRecord {
    return new BorrowRecord({
      id: `rec-${Date.now()}`,
      bookId,
      bookTitle,
      customerName,
      customerEmail,
      borrowDate: new Date().toISOString().split('T')[0],
      returnDate: null,
      status: 'borrowed'
    });
  }
}
