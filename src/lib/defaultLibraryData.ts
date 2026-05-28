import type { BookData, BorrowRecordData, CustomerData, LibraryData } from './types';

export const DEFAULT_BOOKS: BookData[] = [
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

export const DEFAULT_CUSTOMERS: CustomerData[] = [
  { username: 'Budi Santoso', email: 'budi@neolib.com', password: 'password123' },
  { username: 'Rina Wijaya', email: 'rina@neolib.com', password: 'password123' },
  { username: 'Dewi Lestari', email: 'dewi@neolib.com', password: 'password123' }
];

export const DEFAULT_BORROW_RECORDS: BorrowRecordData[] = [
  { id: 'rec-1', bookId: 'book-1', bookTitle: 'Bumi', customerName: 'Budi Santoso', customerEmail: 'budi@neolib.com', borrowDate: '2026-05-20', returnDate: null, borrowPrice: 12000, paymentId: 'pay-seed-1', paymentMethod: 'ewallet', paymentStatus: 'paid', paidAt: '2026-05-20', status: 'borrowed' },
  { id: 'rec-2', bookId: 'book-1', bookTitle: 'Bumi', customerName: 'Rina Wijaya', customerEmail: 'rina@neolib.com', borrowDate: '2026-05-22', returnDate: null, borrowPrice: 12000, paymentId: 'pay-seed-2', paymentMethod: 'transfer', paymentStatus: 'paid', paidAt: '2026-05-22', status: 'borrowed' },
  { id: 'rec-3', bookId: 'book-2', bookTitle: 'Filosofi Teras', customerName: 'Budi Santoso', customerEmail: 'budi@neolib.com', borrowDate: '2026-05-18', returnDate: null, borrowPrice: 10000, paymentId: 'pay-seed-3', paymentMethod: 'cash', paymentStatus: 'paid', paidAt: '2026-05-18', status: 'borrowed' },
  { id: 'rec-4', bookId: 'book-4', bookTitle: 'Atomic Habits', customerName: 'Dewi Lestari', customerEmail: 'dewi@neolib.com', borrowDate: '2026-05-10', returnDate: '2026-05-17', borrowPrice: 15000, paymentId: 'pay-seed-4', paymentMethod: 'ewallet', paymentStatus: 'paid', paidAt: '2026-05-10', status: 'returned' }
];

export function createDefaultLibraryData(): LibraryData {
  return {
    books: DEFAULT_BOOKS.map((book) => ({ ...book })),
    customers: DEFAULT_CUSTOMERS.map((customer) => ({ ...customer })),
    borrowRecords: DEFAULT_BORROW_RECORDS.map((record) => ({ ...record }))
  };
}
