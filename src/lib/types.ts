export interface BookData {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  category: string;
  coverUrl: string;
  price: number;
  stock: number;
  borrowedCount: number;
}

export type BorrowStatus = 'borrowed' | 'returned' | 'overdue';
export type PaymentMethod = 'cash' | 'transfer' | 'ewallet';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type FineStatus = 'none' | 'unpaid' | 'paid';

export interface PaymentData {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface BorrowRecordData {
  id: string;
  bookId: string;
  bookTitle: string;
  customerName: string;
  customerEmail: string;
  borrowDate: string;
  returnDate: string | null;
  dueDate?: string;
  lateDays?: number;
  fineAmount?: number;
  fineStatus?: FineStatus;
  borrowPrice?: number;
  paymentId?: string | null;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAt?: string | null;
  status: BorrowStatus;
}

export interface UserSessionData {
  username: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface CustomerData {
  username: string;
  email: string;
  password?: string;
}

export interface LibraryData {
  books: BookData[];
  customers: CustomerData[];
  borrowRecords: BorrowRecordData[];
}
