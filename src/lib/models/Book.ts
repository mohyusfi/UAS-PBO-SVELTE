// ============================================================
// BOOK.ts — Encapsulation
// ============================================================
// Semua field private, akses lewat getter.
// Mutasi stok hanya lewat method deductStock() & restoreStock()
// sehingga tidak bisa diubah sembarangan dari luar class.
// ============================================================

import type { BookData } from '../types';

export class Book {
  private _id: string;
  private _title: string;
  private _author: string;
  private _isbn: string;
  private _description: string;
  private _category: string;
  private _coverUrl: string;
  private _stock: number;
  private _borrowedCount: number;

  constructor(data: BookData) {
    this._id = data.id;
    this._title = data.title;
    this._author = data.author;
    this._isbn = data.isbn;
    this._description = data.description;
    this._category = data.category;
    this._coverUrl = data.coverUrl;
    this._stock = data.stock;
    this._borrowedCount = data.borrowedCount;
  }

  // --- Encapsulation: Read-only getters ---
  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get author(): string { return this._author; }
  get isbn(): string { return this._isbn; }
  get description(): string { return this._description; }
  get category(): string { return this._category; }
  get coverUrl(): string { return this._coverUrl; }
  get stock(): number { return this._stock; }
  get borrowedCount(): number { return this._borrowedCount; }

  /** Cek apakah buku masih tersedia untuk dipinjam */
  get isAvailable(): boolean {
    return this._stock > 0;
  }

  // --- Encapsulation: Controlled mutation via methods ---

  /**
   * Kurangi stok saat dipinjam. Return false jika stok habis.
   */
  deductStock(): boolean {
    if (this._stock <= 0) return false;
    this._stock -= 1;
    this._borrowedCount += 1;
    return true;
  }

  /**
   * Tambah stok saat dikembalikan.
   */
  restoreStock(): void {
    this._stock += 1;
  }

  /**
   * Update detail buku (hanya field yang diberikan).
   */
  updateDetails(fields: Partial<Omit<BookData, 'id' | 'borrowedCount'>>): void {
    if (fields.title !== undefined) this._title = fields.title;
    if (fields.author !== undefined) this._author = fields.author;
    if (fields.isbn !== undefined) this._isbn = fields.isbn;
    if (fields.description !== undefined) this._description = fields.description;
    if (fields.category !== undefined) this._category = fields.category;
    if (fields.coverUrl !== undefined) this._coverUrl = fields.coverUrl;
    if (fields.stock !== undefined) this._stock = fields.stock;
  }

  /**
   * Serialize ke plain object untuk localStorage.
   */
  toJSON(): BookData {
    return {
      id: this._id,
      title: this._title,
      author: this._author,
      isbn: this._isbn,
      description: this._description,
      category: this._category,
      coverUrl: this._coverUrl,
      stock: this._stock,
      borrowedCount: this._borrowedCount
    };
  }

  /**
   * Factory method — buat instance Book dari plain data.
   */
  static fromJSON(data: BookData): Book {
    return new Book(data);
  }
}
