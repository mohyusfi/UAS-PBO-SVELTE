import { PUBLIC_ADMIN_EMAIL, PUBLIC_ADMIN_PASSWORD } from '$env/static/public';
import type {
  BookData,
  BorrowRecordData,
  CustomerData,
  LibraryData,
  LibraryDataPatch,
  PaymentMethod,
  UserSessionData
} from './types';
import { Book } from './models/Book';
import { BorrowRecord } from './models/BorrowRecord';
import { Payment } from './models/Payment';
import { User, AdminUser, CustomerUser } from './models/User';
import { DEFAULT_BOOKS, DEFAULT_BORROW_RECORDS, DEFAULT_CUSTOMERS } from './defaultLibraryData';

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

  private withBookDefaults(data: BookData): BookData {
    const fallback = DEFAULT_BOOKS.find(
      (book) => book.id === data.id || book.isbn === data.isbn || book.title === data.title
    );

    return {
      ...data,
      price: data.price ?? fallback?.price ?? 0
    };
  }

  private withBorrowRecordDefaults(data: BorrowRecordData): BorrowRecordData {
    const book = this.books.find((item) => item.id === data.bookId);

    return {
      ...data,
      borrowPrice: data.borrowPrice ?? book?.price ?? 0,
      paymentId: data.paymentId ?? `pay-legacy-${data.id}`,
      paymentMethod: data.paymentMethod ?? 'cash',
      paymentStatus: data.paymentStatus ?? 'paid',
      paidAt: data.paidAt ?? data.borrowDate
    };
  }

  private initStore(): void {
    if (typeof window === 'undefined') return;

    this.applyLibraryData({
      books: DEFAULT_BOOKS,
      customers: DEFAULT_CUSTOMERS,
      borrowRecords: DEFAULT_BORROW_RECORDS
    });
    this.loadSession();
    void this.refreshData();
  }

  private applyLibraryData(data: LibraryData): void {
    this.books = data.books.map((book) => Book.fromJSON(this.withBookDefaults(book)));
    this.customers = data.customers.map((customer) => ({ ...customer }));
    this.borrowRecords = data.borrowRecords.map((record) =>
      BorrowRecord.fromJSON(this.withBorrowRecordDefaults(record))
    );
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

  private queueSave(patch: LibraryDataPatch): void {
    if (typeof window === 'undefined') return;

    this.saveQueue = this.saveQueue
      .then(async () => {
        const response = await fetch('/api/library', {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(patch)
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

  private saveBooks(): void {
    this.queueSave({ books: this.books.map(b => b.toJSON()) });
  }

  private saveCustomers(): void {
    this.queueSave({ customers: this.customers.map((customer) => ({ ...customer })) });
  }

  private saveRecords(): void {
    this.queueSave({ borrowRecords: this.borrowRecords.map(r => r.toJSON()) });
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
    this.saveCustomers();

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
    this.saveBooks();
    return newBook;
  }

  updateBook(id: string, updatedFields: Partial<Omit<BookData, 'id' | 'borrowedCount'>>): void {
    const book = this.books.find(b => b.id === id);
    if (book) {
      book.updateDetails(updatedFields);
      this.saveBooks();
    }
  }

  deleteBook(id: string): void {
    this.books = this.books.filter(b => b.id !== id);
    this.saveBooks();
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
    this.saveBooks();

    const record = BorrowRecord.create(bookId, book.title, customerName, customerEmail, payment.toJSON());
    this.borrowRecords.unshift(record);
    this.borrowRecords = [...this.borrowRecords];
    this.saveRecords();

    return { success: true, record, payment };
  }

  returnBook(recordId: string): ReturnBookResult {
    const record = this.borrowRecords.find(r => r.id === recordId);
    if (!record) return { success: false, error: 'Transaksi tidak ditemukan.' };

    if (!record.markReturned()) return { success: false, error: 'Buku sudah dikembalikan.' };
    this.borrowRecords = [...this.borrowRecords];
    this.saveRecords();

    const book = this.books.find(b => b.id === record.bookId);
    if (book) {
      book.restoreStock();
      this.books = [...this.books];
      this.saveBooks();
    }

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
      this.saveRecords();
    }

    return success;
  }
}

export const library = new LibraryStore();
