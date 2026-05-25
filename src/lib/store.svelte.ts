// ============================================================
// STORE.SVELTE.TS — Singleton Store (OOP Pattern)
// ============================================================
// LibraryStore menggunakan class-based models:
//   - Book (encapsulation)
//   - BorrowRecord (encapsulation)
//   - User / AdminUser / CustomerUser (inheritance + polymorphism)
// 
// Store sendiri adalah contoh Encapsulation:
//   - Private helper methods (saveBooks, saveRecords, dll)
//   - Public API yang terkontrol
// ============================================================

import { PUBLIC_ADMIN_EMAIL, PUBLIC_ADMIN_PASSWORD } from '$env/static/public';
import type { BookData, BorrowRecordData, CustomerData, UserSessionData } from './types';
import { Book } from './models/Book';
import { BorrowRecord } from './models/BorrowRecord';
import { User, AdminUser, CustomerUser } from './models/User';

// --- Default Seed Data ---
const DEFAULT_BOOKS: BookData[] = [
  {
    id: 'book-1',
    title: 'Bumi',
    author: 'Tere Liye',
    isbn: '9786020332956',
    description: 'Bumi adalah novel petualangan dunia paralel karya Tere Liye. Novel ini menceritakan petualangan tiga remaja, Raib, Seli, dan Ali yang memiliki kemampuan istimewa untuk menjelajah ke dunia bawah tanah (Klan Bulan).',
    category: 'Fiksi',
    coverUrl: '',
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
  { id: 'rec-1', bookId: 'book-1', bookTitle: 'Bumi', customerName: 'Budi Santoso', customerEmail: 'budi@neolib.com', borrowDate: '2026-05-20', returnDate: null, status: 'borrowed' },
  { id: 'rec-2', bookId: 'book-1', bookTitle: 'Bumi', customerName: 'Rina Wijaya', customerEmail: 'rina@neolib.com', borrowDate: '2026-05-22', returnDate: null, status: 'borrowed' },
  { id: 'rec-3', bookId: 'book-2', bookTitle: 'Filosofi Teras', customerName: 'Budi Santoso', customerEmail: 'budi@neolib.com', borrowDate: '2026-05-18', returnDate: null, status: 'borrowed' },
  { id: 'rec-4', bookId: 'book-4', bookTitle: 'Atomic Habits', customerName: 'Dewi Lestari', customerEmail: 'dewi@neolib.com', borrowDate: '2026-05-10', returnDate: '2026-05-17', status: 'returned' }
];

// ============================================================
// LibraryStore — Singleton class, Encapsulation pada persistence
// ============================================================
class LibraryStore {
  // Svelte 5 reactive state
  books = $state<Book[]>([]);
  borrowRecords = $state<BorrowRecord[]>([]);
  customers = $state<CustomerData[]>([]);
  currentUser = $state<User | null>(null);

  constructor() {
    this.initStore();
  }

  // --- Encapsulation: Private initialization & persistence ---

  private initStore(): void {
    if (typeof window === 'undefined') return;

    // Load Books → class instances
    const storedBooks = localStorage.getItem('lib_books');
    if (storedBooks) {
      try {
        const parsed: BookData[] = JSON.parse(storedBooks);
        this.books = parsed.map(Book.fromJSON);
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
        this.borrowRecords = parsed.map(BorrowRecord.fromJSON);
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

  // --- Public API: Authentication ---

  /**
   * Login — menggunakan Polymorphism untuk membuat AdminUser atau CustomerUser
   */
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

  /**
   * Register customer baru — otomatis login sebagai CustomerUser
   */
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

    this.currentUser = new CustomerUser(username, email); // Inheritance!
    this.saveSession();

    return { success: true };
  }

  logout(): void {
    this.currentUser = null;
    this.saveSession();
  }

  // --- Public API: Book CRUD (Admin only) ---

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

  // --- Public API: Borrowing (Customer only) ---

  /**
   * Pinjam buku — menggunakan method encapsulated dari Book & BorrowRecord
   */
  borrowBook(bookId: string, customerEmail: string): boolean {
    const book = this.books.find(b => b.id === bookId);
    if (!book || !book.isAvailable) return false; // Encapsulation: cek via getter

    const customer = this.customers.find(
      c => c.email.toLowerCase() === customerEmail.toLowerCase()
    );
    const customerName = customer ? customer.username : 'Customer';

    // Cek duplikat pinjam
    const alreadyBorrowed = this.borrowRecords.some(
      r => r.bookId === bookId &&
        r.customerEmail && r.customerEmail.toLowerCase() === customerEmail.toLowerCase() &&
        r.isBorrowed // Encapsulation: cek via getter
    );
    if (alreadyBorrowed) return false;

    // Kurangi stok via method (Encapsulation)
    if (!book.deductStock()) return false;
    this.books = [...this.books];
    this.saveBooks();

    // Buat record via factory method
    const record = BorrowRecord.create(bookId, book.title, customerName, customerEmail);
    this.borrowRecords.unshift(record);
    this.borrowRecords = [...this.borrowRecords];
    this.saveRecords();

    return true;
  }

  /**
   * Kembalikan buku — menggunakan method encapsulated
   */
  returnBook(recordId: string): boolean {
    const record = this.borrowRecords.find(r => r.id === recordId);
    if (!record) return false;

    // Tandai dikembalikan via method (Encapsulation)
    if (!record.markReturned()) return false;
    this.borrowRecords = [...this.borrowRecords];
    this.saveRecords();

    // Kembalikan stok via method (Encapsulation)
    const book = this.books.find(b => b.id === record.bookId);
    if (book) {
      book.restoreStock();
      this.books = [...this.books];
      this.saveBooks();
    }

    return true;
  }
}

// Singleton instance
export const library = new LibraryStore();
