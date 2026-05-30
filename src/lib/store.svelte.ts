import { PUBLIC_ADMIN_EMAIL, PUBLIC_ADMIN_PASSWORD } from '$env/static/public';
import type {
  BookData,
  CustomerData,
  LibraryData,
  PaymentMethod,
  UserSessionData
} from './types';
import { Book } from './models/Book';
import { BorrowRecord } from './models/BorrowRecord';
import { Payment } from './models/Payment';
import { User, AdminUser, CustomerUser } from './models/User';

interface BorrowBookResult {
  success: boolean;
  error?: string;
  record?: BorrowRecord;
  payment?: Payment;
}

interface ReturnBookResult {
  success: boolean;
  error?: string;
  record?: BorrowRecord;
  lateDays?: number;
  fineAmount?: number;
}

class LibraryStore {
  books = $state<Book[]>([]);
  borrowRecords = $state<BorrowRecord[]>([]);
  customers = $state<CustomerData[]>([]);
  currentUser = $state<User | null>(null);
  syncError = $state<string | null>(null);

  private saveQueue = Promise.resolve();

  constructor() {
    this.initStore();
  }

  private initStore(): void {
    if (typeof window === 'undefined') return;

    this.loadSession();
    void this.refreshData();
  }

  private applyLibraryData(data: LibraryData): void {
    this.books = data.books.map((book) => Book.fromJSON(book));
    this.customers = data.customers.map((customer) => ({ ...customer }));
    this.borrowRecords = data.borrowRecords.map((record) => BorrowRecord.fromJSON(record));
  }

  private loadSession(): void {
    const storedSession = localStorage.getItem('lib_session');
    if (storedSession) {
      try {
        const data: UserSessionData = JSON.parse(storedSession);
        this.currentUser = User.fromSessionData(data);
      } catch {
        this.currentUser = null;
      }
    }
  }

  async refreshData(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch('/api/library');
      if (!response.ok) throw new Error('Gagal mengambil data perpustakaan.');

      const data: LibraryData = await response.json();
      this.applyLibraryData(data);
      this.syncError = null;
    } catch (error) {
      this.syncError = error instanceof Error ? error.message : 'Gagal mengambil data perpustakaan.';
    }
  }

  private queueRequest(path: string, method: string, body?: unknown): void {
    if (typeof window === 'undefined') return;

    this.saveQueue = this.saveQueue
      .then(async () => {
        const response = await fetch(path, {
          method,
          headers: {
            'content-type': 'application/json'
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) })
        });

        if (!response.ok) {
          throw new Error('Gagal menyimpan data perpustakaan.');
        }

        this.syncError = null;
      })
      .catch((error) => {
        this.syncError = error instanceof Error ? error.message : 'Gagal menyimpan data perpustakaan.';
        console.error(error);
      });
  }

  private createBook(book: Book): void {
    this.queueRequest('/api/books', 'POST', book.toJSON());
  }

  private saveBook(book: Book): void {
    this.queueRequest(`/api/books/${encodeURIComponent(book.id)}`, 'PATCH', book.toJSON());
  }

  private removeBook(id: string): void {
    this.queueRequest(`/api/books/${encodeURIComponent(id)}`, 'DELETE');
  }

  private saveCustomer(customer: CustomerData): void {
    this.queueRequest('/api/customers', 'POST', { ...customer });
  }

  private createBorrowRecord(record: BorrowRecord, book: Book): void {
    this.queueRequest('/api/borrow-records', 'POST', {
      record: record.toJSON(),
      book: book.toJSON()
    });
  }

  private saveBorrowRecord(record: BorrowRecord, book?: Book): void {
    this.queueRequest(`/api/borrow-records/${encodeURIComponent(record.id)}`, 'PATCH', {
      record: record.toJSON(),
      ...(book ? { book: book.toJSON() } : {})
    });
  }

  private saveSession(): void {
    if (typeof window !== 'undefined') {
      if (this.currentUser) {
        localStorage.setItem('lib_session', JSON.stringify(this.currentUser.toSessionData()));
      } else {
        localStorage.removeItem('lib_session');
      }
    }
  }


  login(email: string, password: string): { success: boolean; error?: string } {
    if (email.toLowerCase() === PUBLIC_ADMIN_EMAIL.toLowerCase()) {
      if (password === PUBLIC_ADMIN_PASSWORD) {
        this.currentUser = new AdminUser('Admin Perpustakaan', email);
        this.saveSession();
        return { success: true };
      }
      return { success: false, error: 'Password salah!' };
    }

    const customer = this.customers.find(
      c => c.email.toLowerCase() === email.toLowerCase()
    );

    if (customer) {
      if (customer.password === password) {
        this.currentUser = new CustomerUser(customer.username, email);
        this.saveSession();
        return { success: true };
      }
      return { success: false, error: 'Password salah!' };
    }

    return { success: false, error: 'Akun tidak terdaftar! Silakan registrasi terlebih dahulu.' };
  }



  registerCustomer(username: string, email: string, password: string): { success: boolean; error?: string } {
    if (email.toLowerCase() === PUBLIC_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: 'Email ini sudah digunakan!' };
    }

    const exists = this.customers.some(
      c => c.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) {
      return { success: false, error: 'Email sudah terdaftar!' };
    }

    this.customers.push({ username, email, password });
    this.saveCustomer({ username, email, password });

    this.currentUser = new CustomerUser(username, email);
    this.saveSession();

    return { success: true };
  }

  logout(): void {
    this.currentUser = null;
    this.saveSession();
  }


  addBook(bookData: Omit<BookData, 'id' | 'borrowedCount'>): Book {
    const newBook = new Book({
      ...bookData,
      id: `book-${Date.now()}`,
      borrowedCount: 0
    });
    this.books.push(newBook);
    this.createBook(newBook);
    return newBook;
  }

  updateBook(id: string, updatedFields: Partial<Omit<BookData, 'id' | 'borrowedCount'>>): void {
    const book = this.books.find(b => b.id === id);
    if (book) {
      book.updateDetails(updatedFields);
      this.saveBook(book);
    }
  }

  deleteBook(id: string): void {
    this.books = this.books.filter(b => b.id !== id);
    this.removeBook(id);
  }

  get activeBorrowRecords(): BorrowRecord[] {
    return this.borrowRecords.filter((record) => record.isBorrowed);
  }

  get overdueBorrowRecords(): BorrowRecord[] {
    return this.borrowRecords.filter((record) => record.isOverdue);
  }

  get totalBorrowRevenue(): number {
    return this.borrowRecords
      .filter((record) => record.paymentStatus === 'paid')
      .reduce((total, record) => total + record.borrowPrice, 0);
  }

  get unpaidFineTotal(): number {
    return this.borrowRecords
      .filter((record) => record.status === 'returned' && record.fineStatus === 'unpaid')
      .reduce((total, record) => total + record.fineAmount, 0);
  }

  borrowBook(bookId: string, customerEmail: string, paymentMethod: PaymentMethod = 'ewallet'): BorrowBookResult {
    if (!this.currentUser || !this.currentUser.canBorrow()) {
      return { success: false, error: 'Hanya customer yang dapat meminjam buku.' };
    }

    const book = this.books.find(b => b.id === bookId);
    if (!book) return { success: false, error: 'Buku tidak ditemukan.' };
    if (!book.isAvailable) return { success: false, error: 'Stok buku habis.' };

    const customer = this.customers.find(
      c => c.email.toLowerCase() === customerEmail.toLowerCase()
    );
    if (!customer) return { success: false, error: 'Data customer tidak ditemukan.' };

    const customerName = customer ? customer.username : 'Customer';

    const alreadyBorrowed = this.borrowRecords.some(
      r => r.bookId === bookId &&
        r.customerEmail && r.customerEmail.toLowerCase() === customerEmail.toLowerCase() &&
        r.isBorrowed
    );
    if (alreadyBorrowed) {
      return { success: false, error: 'Anda sedang meminjam buku ini.' };
    }

    const payment = Payment.create(book.price, paymentMethod);
    payment.markPaid();

    if (!payment.isPaid) {
      payment.markFailed();
      return { success: false, error: 'Pembayaran gagal diproses.', payment };
    }

    if (!book.deductStock()) {
      return { success: false, error: 'Stok buku habis.' };
    }
    this.books = [...this.books];

    const record = BorrowRecord.create(bookId, book.title, customerName, customerEmail, payment.toJSON());
    this.borrowRecords.unshift(record);
    this.borrowRecords = [...this.borrowRecords];
    this.createBorrowRecord(record, book);

    return { success: true, record, payment };
  }

  returnBook(recordId: string): ReturnBookResult {
    const record = this.borrowRecords.find(r => r.id === recordId);
    if (!record) return { success: false, error: 'Transaksi tidak ditemukan.' };

    if (!record.markReturned()) return { success: false, error: 'Buku sudah dikembalikan.' };
    this.borrowRecords = [...this.borrowRecords];

    const book = this.books.find(b => b.id === record.bookId);
    if (book) {
      book.restoreStock();
      this.books = [...this.books];
    }
    this.saveBorrowRecord(record, book);

    return {
      success: true,
      record,
      lateDays: record.lateDays,
      fineAmount: record.fineAmount
    };
  }

  payFine(recordId: string): boolean {
    const record = this.borrowRecords.find(r => r.id === recordId);
    if (!record) return false;

    const success = record.markFinePaid();
    if (success) {
      this.borrowRecords = [...this.borrowRecords];
      this.saveBorrowRecord(record);
    }

    return success;
  }
}

export const library = new LibraryStore();
