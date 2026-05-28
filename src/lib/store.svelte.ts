import { PUBLIC_ADMIN_EMAIL, PUBLIC_ADMIN_PASSWORD } from '$env/static/public';
import type { BookData, BorrowRecordData, CustomerData, PaymentMethod, UserSessionData } from './types';
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


const DEFAULT_BOOKS: BookData[] = [
  {
    id: 'book-1',
    title: 'Bumi',
    author: 'Tere Liye',
    isbn: '9786020332956',
    description: 'Bumi adalah novel petualangan dunia paralel karya Tere Liye. Novel ini menceritakan petualangan tiga remaja, Raib, Seli, dan Ali yang memiliki kemampuan istimewa untuk menjelajah ke dunia bawah tanah (Klan Bulan).',
    category: 'Fiksi',
    coverUrl: '',
    price: 12000,
    stock: 5,
    borrowedCount: 2
  },
  {
    id: 'book-2',
    title: 'Filosofi Teras',
    author: 'Henry Manampiring',
    isbn: '9786024125189',
    description: 'Filosofi Teras adalah buku pengantar filsafat Stoisisme yang dikemas secara populer dan praktis untuk kehidupan sehari-hari, membantu mengendalikan emosi negatif dan menemukan ketenangan hidup.',
    category: 'Filsafat',
    coverUrl: '',
    price: 10000,
    stock: 3,
    borrowedCount: 1
  },
  {
    id: 'book-3',
    title: 'Laskar Pelangi',
    author: 'Andrea Hirata',
    isbn: '9793062797',
    description: 'Laskar Pelangi bercerita tentang kehidupan 10 anak dari keluarga miskin di Pulau Belitung yang bersekolah di sebuah sekolah Muhammadiyah yang terancam ditutup, berjuang menggapai mimpi mereka.',
    category: 'Fiksi',
    coverUrl: '',
    price: 11000,
    stock: 4,
    borrowedCount: 0
  },
  {
    id: 'book-4',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9786020633176',
    description: 'Atomic Habits menyajikan panduan praktis berdasarkan sains untuk membangun kebiasaan baik dan menghilangkan kebiasaan buruk dengan memanfaatkan perubahan kecil 1% setiap harinya.',
    category: 'Pengembangan Diri',
    coverUrl: '',
    price: 15000,
    stock: 6,
    borrowedCount: 1
  }
];

const DEFAULT_CUSTOMERS: CustomerData[] = [
  { username: 'Budi Santoso', email: 'budi@neolib.com', password: 'password123' },
  { username: 'Rina Wijaya', email: 'rina@neolib.com', password: 'password123' },
  { username: 'Dewi Lestari', email: 'dewi@neolib.com', password: 'password123' }
];

const DEFAULT_BORROW_RECORDS: BorrowRecordData[] = [
  { id: 'rec-1', bookId: 'book-1', bookTitle: 'Bumi', customerName: 'Budi Santoso', customerEmail: 'budi@neolib.com', borrowDate: '2026-05-20', returnDate: null, borrowPrice: 12000, paymentId: 'pay-seed-1', paymentMethod: 'ewallet', paymentStatus: 'paid', paidAt: '2026-05-20', status: 'borrowed' },
  { id: 'rec-2', bookId: 'book-1', bookTitle: 'Bumi', customerName: 'Rina Wijaya', customerEmail: 'rina@neolib.com', borrowDate: '2026-05-22', returnDate: null, borrowPrice: 12000, paymentId: 'pay-seed-2', paymentMethod: 'transfer', paymentStatus: 'paid', paidAt: '2026-05-22', status: 'borrowed' },
  { id: 'rec-3', bookId: 'book-2', bookTitle: 'Filosofi Teras', customerName: 'Budi Santoso', customerEmail: 'budi@neolib.com', borrowDate: '2026-05-18', returnDate: null, borrowPrice: 10000, paymentId: 'pay-seed-3', paymentMethod: 'cash', paymentStatus: 'paid', paidAt: '2026-05-18', status: 'borrowed' },
  { id: 'rec-4', bookId: 'book-4', bookTitle: 'Atomic Habits', customerName: 'Dewi Lestari', customerEmail: 'dewi@neolib.com', borrowDate: '2026-05-10', returnDate: '2026-05-17', borrowPrice: 15000, paymentId: 'pay-seed-4', paymentMethod: 'ewallet', paymentStatus: 'paid', paidAt: '2026-05-10', status: 'returned' }
];

class LibraryStore {
  books = $state<Book[]>([]);
  borrowRecords = $state<BorrowRecord[]>([]);
  customers = $state<CustomerData[]>([]);
  currentUser = $state<User | null>(null);

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


    const storedBooks = localStorage.getItem('lib_books');
    if (storedBooks) {
      try {
        const parsed: BookData[] = JSON.parse(storedBooks);
        this.books = parsed.map((book) => Book.fromJSON(this.withBookDefaults(book)));
        this.saveBooks();
      } catch {
        this.books = DEFAULT_BOOKS.map(Book.fromJSON);
      }
    } else {
      this.books = DEFAULT_BOOKS.map(Book.fromJSON);
      this.saveBooks();
    }

    // Load Customers
    const storedCustomers = localStorage.getItem('lib_customers');
    if (storedCustomers) {
      try {
        this.customers = JSON.parse(storedCustomers);
      } catch {
        this.customers = [...DEFAULT_CUSTOMERS];
      }
    } else {
      this.customers = [...DEFAULT_CUSTOMERS];
      this.saveCustomers();
    }

    // Load BorrowRecords → class instances
    const storedRecords = localStorage.getItem('lib_records');
    if (storedRecords) {
      try {
        const parsed: BorrowRecordData[] = JSON.parse(storedRecords);
        this.borrowRecords = parsed.map((record) => BorrowRecord.fromJSON(this.withBorrowRecordDefaults(record)));
        this.saveRecords();
      } catch {
        this.borrowRecords = DEFAULT_BORROW_RECORDS.map(BorrowRecord.fromJSON);
      }
    } else {
      this.borrowRecords = DEFAULT_BORROW_RECORDS.map(BorrowRecord.fromJSON);
      this.saveRecords();
    }

    // Load Session → polymorphic User instance via factory
    const storedSession = localStorage.getItem('lib_session');
    if (storedSession) {
      try {
        const data: UserSessionData = JSON.parse(storedSession);
        this.currentUser = User.fromSessionData(data); // Polymorphism!
      } catch {
        this.currentUser = null;
      }
    }
  }

  private saveBooks(): void {
    if (typeof window !== 'undefined') {
      // Serialize class instances → plain objects via toJSON()
      localStorage.setItem('lib_books', JSON.stringify(this.books.map(b => b.toJSON())));
    }
  }

  private saveCustomers(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lib_customers', JSON.stringify(this.customers));
    }
  }

  private saveRecords(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lib_records', JSON.stringify(this.borrowRecords.map(r => r.toJSON())));
    }
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
    // 1. Check Admin credentials (dari .env)
    if (email.toLowerCase() === PUBLIC_ADMIN_EMAIL.toLowerCase()) {
      if (password === PUBLIC_ADMIN_PASSWORD) {
        this.currentUser = new AdminUser('Admin Perpustakaan', email); // Inheritance!
        this.saveSession();
        return { success: true };
      }
      return { success: false, error: 'Password salah!' };
    }

    // 2. Check registered Customer
    const customer = this.customers.find(
      c => c.email.toLowerCase() === email.toLowerCase()
    );

    if (customer) {
      if (customer.password === password) {
        this.currentUser = new CustomerUser(customer.username, email); // Inheritance!
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
      book.updateDetails(updatedFields); // Encapsulation: update via method
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

  // --- Public API: Borrowing (Customer only) ---

  /**
   * Pinjam buku — menggunakan method encapsulated dari Book & BorrowRecord
   */
  borrowBook(bookId: string, customerEmail: string, paymentMethod: PaymentMethod = 'ewallet'): BorrowBookResult {
    if (!this.currentUser || !this.currentUser.canBorrow()) {
      return { success: false, error: 'Hanya customer yang dapat meminjam buku.' };
    }

    const book = this.books.find(b => b.id === bookId);
    if (!book) return { success: false, error: 'Buku tidak ditemukan.' };
    if (!book.isAvailable) return { success: false, error: 'Stok buku habis.' }; // Encapsulation: cek via getter

    const customer = this.customers.find(
      c => c.email.toLowerCase() === customerEmail.toLowerCase()
    );
    if (!customer) return { success: false, error: 'Data customer tidak ditemukan.' };

    const customerName = customer ? customer.username : 'Customer';

    // Cek duplikat pinjam
    const alreadyBorrowed = this.borrowRecords.some(
      r => r.bookId === bookId &&
        r.customerEmail && r.customerEmail.toLowerCase() === customerEmail.toLowerCase() &&
        r.isBorrowed // Encapsulation: cek via getter
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

    // Kurangi stok via method (Encapsulation)
    if (!book.deductStock()) {
      return { success: false, error: 'Stok buku habis.' };
    }
    this.books = [...this.books];
    this.saveBooks();

    // Buat record via factory method
    const record = BorrowRecord.create(bookId, book.title, customerName, customerEmail, payment.toJSON());
    this.borrowRecords.unshift(record);
    this.borrowRecords = [...this.borrowRecords];
    this.saveRecords();

    return { success: true, record, payment };
  }

  /**
   * Kembalikan buku — menggunakan method encapsulated
   */
  returnBook(recordId: string): ReturnBookResult {
    const record = this.borrowRecords.find(r => r.id === recordId);
    if (!record) return { success: false, error: 'Transaksi tidak ditemukan.' };

    // Tandai dikembalikan via method (Encapsulation)
    if (!record.markReturned()) return { success: false, error: 'Buku sudah dikembalikan.' };
    this.borrowRecords = [...this.borrowRecords];
    this.saveRecords();

    // Kembalikan stok via method (Encapsulation)
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

// Singleton instance
export const library = new LibraryStore();
