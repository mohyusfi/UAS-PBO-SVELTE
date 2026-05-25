// ============================================================
// TYPES.ts — Plain data interfaces untuk serialization (JSON/localStorage)
// ============================================================
// Interface ini digunakan untuk konversi dari/ke class OOP.
// Class punya method & encapsulation, interface ini cuma "shape" data.
// ============================================================

/** Plain data shape untuk Book (serialization ke localStorage) */
export interface BookData {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  category: string;
  coverUrl: string;
  stock: number;
  borrowedCount: number;
}

/** Plain data shape untuk BorrowRecord */
export interface BorrowRecordData {
  id: string;
  bookId: string;
  bookTitle: string;
  customerName: string;
  customerEmail: string;
  borrowDate: string;
  returnDate: string | null;
  status: 'borrowed' | 'returned';
}

/** Plain data shape untuk User session (disimpan di localStorage) */
export interface UserSessionData {
  username: string;
  email: string;
  role: 'admin' | 'customer';
}

/** Plain data untuk customer yang terdaftar */
export interface CustomerData {
  username: string;
  email: string;
  password?: string;
}
