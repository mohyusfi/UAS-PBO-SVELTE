# Plan Implementasi OOP - Aplikasi Perpustakaan Neo Brutalism

## Tujuan
Mengimplementasikan 3 pilar OOP (**Encapsulation**, **Inheritance**, **Polymorphism**) ke dalam arsitektur TypeScript proyek ini. Semua perubahan dilakukan di layer `src/lib/` (logika bisnis), halaman Svelte di `src/routes/` hanya menyesuaikan import — **desain Neo Brutalism tidak berubah**.
Selain itu, menangani keamanan data (defensive programming) agar kebal terhadap struktur data lawas (legacy). Tahap sebelumnya memindahkan penyimpanan utama dari `localStorage` ke file JSON bersama di sisi server aplikasi; tahap migrasi berikutnya memindahkan penyimpanan utama ke **Supabase Postgres** dengan **Drizzle ORM** sebagai layer akses database.
Pengembangan berikutnya menambahkan harga pada setiap buku, fitur pembayaran saat peminjaman, transaksi buku, deadline peminjaman, dan biaya tambahan/denda jika buku terlambat dikembalikan.

---

## Analogi Sederhana

| Pilar OOP | Analogi | Implementasi di Proyek |
|---|---|---|
| **Encapsulation** | Brankas bank — data di dalam, akses lewat pintu kunci | Field `private`, mutasi stok terkontrol, akses via getter/method |
| **Inheritance** | Anak mewarisi sifat orang tua | `User` (parent) → `AdminUser` & `CustomerUser` (child) |
| **Polymorphism** | Tombol "Play" beda behavior di Spotify vs YouTube | Method `canBorrow()` diizinkan untuk Customer, tapi ditolak untuk Admin |

---

## Struktur File

### File yang DIUBAH / DIRENCANAKAN DIUBAH
| File | Perubahan |
|---|---|
| `package.json` | Tambah dependency `drizzle-orm` + `postgres`, dan dev dependency `drizzle-kit` + `dotenv` + `tsx`; tambah script `db:generate`, `db:migrate`, `db:studio`, dan opsional `db:seed` |
| `.env` | Tambah `DATABASE_URL` server-only dari Supabase Connection Pooler; tidak memakai prefix `PUBLIC_` agar credential tidak bocor ke browser |
| `drizzle.config.ts` | Konfigurasi Drizzle Kit untuk schema Postgres dan folder migrasi |
| `src/lib/types.ts` | Interface serialisasi JSON untuk data buku, customer, transaksi, pembayaran, deadline, status pembayaran denda, dan nominal denda |
| `src/lib/store.svelte.ts` | Tetap pakai class model dan instance polymorphic; sinkronisasi data tetap lewat `/api/library`, bukan akses database langsung dari browser |
| `src/routes/api/library/+server.ts` | Endpoint server untuk membaca dan menyimpan data perpustakaan lewat repository Drizzle |
| `src/lib/server/libraryStorage.ts` | Legacy helper file JSON; diganti oleh repository database atau dipertahankan sementara hanya sebagai sumber migrasi/backup |
| `src/routes/(app)/*` | Penyesuaian layout, routing (seperti `/books/[id]`), dan defensive checks |
| `src/lib/models/Book.ts` | Ditambah field harga buku (`price`) dengan getter dan validasi update harga |
| `src/lib/models/BorrowRecord.ts` | Ditambah `dueDate`, `lateDays`, `fineAmount`, data pembayaran peminjaman, dan method kalkulasi denda |
| `src/routes/(app)/books/[id]/+page.svelte` | Menampilkan harga buku, deadline pinjaman, estimasi tanggal pengembalian, dan tombol menuju halaman pembayaran |
| `src/routes/(app)/books/[id]/payment/+page.svelte` | Halaman khusus pembayaran untuk memilih metode pembayaran dan mengonfirmasi peminjaman |
| `src/routes/(app)/history/+page.svelte` | Menampilkan status deadline, jumlah hari terlambat, denda, dan status pembayaran peminjaman |
| `src/routes/(app)/admin/+page.svelte` | Admin dapat memantau transaksi aktif, transaksi overdue, pembayaran peminjaman, dan denda yang belum dibayar |

### File BARU yang DIBUAT / DIRENCANAKAN DIBUAT
| File | Isi |
|---|---|
| `src/lib/models/User.ts` | Abstract class `User` + child `AdminUser`, `CustomerUser` |
| `src/lib/models/Book.ts` | Class `Book` dengan encapsulation (private fields + getter/setter) |
| `src/lib/models/BorrowRecord.ts` | Class `BorrowRecord` dengan encapsulation |
| `src/lib/models/BookTransaction.ts` | Tidak dibuat terpisah — peran transaksi diimplementasikan dengan memperkaya class `BorrowRecord` |
| `src/lib/models/Payment.ts` | Class pembayaran untuk mencatat nominal, metode, status, dan waktu pembayaran |
| `src/lib/models/index.ts` | Barrel export semua models |
| `src/lib/server/db/schema.ts` | Definisi tabel Drizzle untuk `books`, `customers`, dan `borrow_records` |
| `src/lib/server/db/client.ts` | Koneksi server-only ke Supabase Postgres memakai `postgres` + `drizzle` |
| `src/lib/server/libraryRepository.ts` | Repository server-side untuk CRUD data perpustakaan melalui Drizzle |
| `drizzle/` | Folder hasil migrasi SQL dari Drizzle Kit |
| `scripts/seed-library.ts` | Opsional: seed data awal atau migrasi isi `data/library.json` lama ke Supabase |
| `data/library.json` | Legacy/backup sementara; bukan penyimpanan utama setelah migrasi Supabase aktif |

---

## Detail Implementasi per Pilar OOP

### 1. Encapsulation
**Lokasi:** `Book.ts`, `BorrowRecord.ts`, `User.ts`
Semua properti data di-set `private`, akses lewat getter (read) dan method (write).
```typescript
class Book {
  private _id: string;
  private _title: string;
  private _price: number;
  private _stock: number;

  get title(): string { return this._title; }
  get price(): number { return this._price; }
  get isAvailable(): boolean { return this._stock > 0; }

  deductStock(): boolean { ... }   // controlled mutation
  restoreStock(): void { ... }     // controlled mutation
  updatePrice(price: number): void { ... } // validasi harga >= 0
}
```

### 2. Inheritance
**Lokasi:** `User.ts`
- `User` = abstract class dengan shared properties (email, username) dan abstract method
- `AdminUser` extends `User` → implementasi admin
- `CustomerUser` extends `User` → implementasi customer

### 3. Polymorphism
**Lokasi:** `User.ts`
```typescript
abstract class User {
  abstract getRole(): 'admin' | 'customer';
  abstract canBorrow(): boolean;
}

class AdminUser extends User {
  canBorrow() { return false; }  // Admin tidak bisa pinjam
}

class CustomerUser extends User {
  canBorrow() { return true; }   // Customer bisa pinjam
}
```

---

## Perubahan di store.svelte.ts
Store (sebagai Singleton) tetap menggunakan Svelte 5 runes (`$state` dan `$derived`).
- `currentUser` menyimpan instance dari class `AdminUser` atau `CustomerUser` secara polimorfis, tidak lagi plain object.
- Book CRUD (Create, Read, Update, Delete) berinteraksi dengan object-object berbasis class.
- Data utama tidak lagi disimpan ke `localStorage`; store mengambil data dari endpoint `/api/library`, lalu endpoint server menyimpan/membaca data melalui Drizzle ke Supabase Postgres.
- Setiap data buku memiliki `price` sebagai biaya peminjaman yang wajib dibayar customer sebelum transaksi aktif.
- Transaksi buku dibuat saat customer berhasil meminjam buku, lalu disimpan sebagai record aktif.
- `borrowBook()` dipanggil dari halaman pembayaran, menerima metode pembayaran, memvalidasi pembayaran, lalu menghitung `borrowDate` dan `dueDate` otomatis berdasarkan durasi pinjaman.
- `returnBook()` menghitung keterlambatan sebelum menutup transaksi dan mengembalikan stok buku.
- Store menyediakan derived data untuk transaksi aktif, transaksi terlambat, riwayat transaksi, total pembayaran peminjaman, dan total denda customer.

---

## Perubahan Penyimpanan: Supabase Postgres + Drizzle ORM

### Masalah Saat Ini
Penyimpanan file JSON server-side sudah memperbaiki masalah `localStorage` yang terpisah per browser, tetapi masih punya batasan:
- bergantung pada filesystem server;
- tidak aman untuk deploy serverless yang filesystem-nya tidak persisten;
- tidak punya constraint relasi, indeks, transaksi database, atau query yang kuat;
- sulit berkembang jika data transaksi makin banyak.

### Solusi Baru yang Dipakai
Gunakan **Supabase Postgres** sebagai sumber data utama dan **Drizzle ORM** sebagai layer query/type-safe schema di server SvelteKit. Browser tetap tidak mengakses database secara langsung; UI tetap berkomunikasi lewat endpoint `/api/library`.

| Komponen | Peran |
|---|---|
| Supabase Postgres | Penyimpanan utama untuk data buku, customer, dan transaksi |
| Drizzle ORM | Definisi schema, query type-safe, dan migrasi SQL |
| `drizzle.config.ts` | Konfigurasi Drizzle Kit untuk generate dan migrate schema |
| `src/lib/server/db/client.ts` | Koneksi server-only ke Supabase Postgres |
| `src/lib/server/db/schema.ts` | Definisi tabel `books`, `customers`, dan `borrow_records` |
| `src/lib/server/libraryRepository.ts` | Repository untuk operasi baca/tulis data perpustakaan |
| `src/routes/api/library/+server.ts` | API `GET`/`PUT`/`PATCH` yang memanggil repository Drizzle |
| `src/lib/store.svelte.ts` | Client store tetap fetch ke `/api/library`, lalu mengubah plain data menjadi instance class OOP |
| `data/library.json` | Legacy backup/sumber migrasi awal, bukan sumber data utama |

### Dependency dan Script
```bash
npm i drizzle-orm postgres
npm i -D drizzle-kit dotenv tsx
```

Tambahan script yang direncanakan:
```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx scripts/seed-library.ts"
}
```

### Environment
Gunakan connection string dari Supabase Dashboard -> Connect -> Connection Pooler.

```env
DATABASE_URL="postgres://postgres.[project-ref]:[password]@[region].pooler.supabase.com:6543/postgres"
```

### Dampak ke Alur Admin
1. Admin di Browser A menambah buku.
2. Store mengubah instance `Book`, lalu mengirim hasil `toJSON()` ke endpoint server.
3. Endpoint server memanggil repository Drizzle.
4. Repository menyimpan perubahan ke Supabase Postgres.
5. Browser B memanggil `GET /api/library` dan mendapatkan data terbaru dari database yang sama.

Catatan koneksi:
1. `DATABASE_URL` harus server-only dan tidak memakai prefix `PUBLIC_`.
2. Jika memakai Supabase Transaction Pooler port `6543`, koneksi `postgres` perlu `prepare: false` karena transaction pooling tidak mendukung prepared statements.
3. Drizzle hanya boleh di-import di file server seperti `src/lib/server/**` atau route `+server.ts`.

Contoh koneksi:
```typescript
import { DATABASE_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(DATABASE_URL, { prepare: false });

export const db = drizzle(client);
```

### Struktur Tabel yang Direncanakan

| Tabel | Kolom Utama | Catatan |
|---|---|---|
| `books` | `id`, `title`, `author`, `isbn`, `description`, `category`, `cover_url`, `price`, `stock`, `borrowed_count`, `created_at`, `updated_at` | `id` tetap `text` agar kompatibel dengan data lama seperti `book-...`; `price` integer Rupiah |
| `customers` | `email`, `username`, `password_hash`, `created_at`, `updated_at` | Untuk tugas/demo bisa migrasi dari `password`; untuk production sebaiknya pakai Supabase Auth atau hash password |
| `borrow_records` | `id`, `book_id`, `customer_email`, `book_title`, `customer_name`, `borrow_date`, `due_date`, `return_date`, `late_days`, `fine_amount`, `fine_status`, `borrow_price`, `payment_id`, `payment_method`, `payment_status`, `paid_at`, `status`, `created_at`, `updated_at` | Menyimpan snapshot judul, nama customer, harga, dan pembayaran agar riwayat tidak berubah saat data master berubah |

Relasi dan constraint:
1. `borrow_records.book_id` foreign key ke `books.id`.
2. `borrow_records.customer_email` foreign key ke `customers.email`.
3. `books.price`, `books.stock`, `books.borrowed_count`, `borrow_records.late_days`, dan `borrow_records.fine_amount` minimal `0`.
4. Status pembayaran memakai enum `pending`, `paid`, `failed`.
5. Status transaksi memakai enum `borrowed`, `returned`, `overdue`.
6. Status denda memakai enum `none`, `unpaid`, `paid`.

Indeks yang direncanakan:
1. `books.isbn` dibuat unique index.
2. `borrow_records.book_id` untuk join transaksi ke buku.
3. `borrow_records.customer_email` untuk halaman history customer.
4. Partial index transaksi aktif pada `borrow_records(status)` untuk query admin active/overdue.

### Pola Repository
`libraryRepository.ts` menjadi adapter antara API dan database:

```typescript
export async function readLibraryData(): Promise<LibraryData> {
  const [books, customers, borrowRecords] = await Promise.all([
    db.select().from(booksTable),
    db.select().from(customersTable),
    db.select().from(borrowRecordsTable)
  ]);

  return {
    books: books.map(mapBookRowToData),
    customers: customers.map(mapCustomerRowToData),
    borrowRecords: borrowRecords.map(mapBorrowRowToData)
  };
}
```

Untuk operasi `PATCH`, repository hanya menulis bagian yang dikirim:
- `books` -> upsert/delete sesuai hasil dari store;
- `customers` -> upsert customer;
- `borrowRecords` -> upsert transaksi;
- operasi yang menyentuh stok dan transaksi idealnya memakai `db.transaction()` agar stok buku dan record peminjaman tidak terpisah jika salah satu query gagal.

### Alur Migrasi dari JSON Lama ke Supabase
1. Tambah dependency Drizzle dan Postgres client.
2. Tambah `DATABASE_URL` di `.env`.
3. Buat `drizzle.config.ts`.
4. Buat `src/lib/server/db/schema.ts`.
5. Generate migrasi dengan `npm run db:generate`.
6. Jalankan migrasi ke Supabase dengan `npm run db:migrate`.
7. Buat script seed yang membaca `data/library.json` lama dan insert/upsert ke tabel Supabase.
8. Refactor `src/routes/api/library/+server.ts` agar memakai `libraryRepository.ts`, bukan `libraryStorage.ts`.
9. Jalankan `npm run check`.
10. Verifikasi manual:
    - tambah buku dari admin;
    - refresh browser lain;
    - pinjam buku dan bayar;
    - return buku;
    - cek data masuk ke tabel Supabase.

### Aturan Penyimpanan Setelah Migrasi
1. `localStorage` tidak dipakai untuk data utama seperti buku, customer, dan transaksi.
2. `data/library.json` tidak lagi menjadi sumber utama; hanya backup atau seed awal.
3. Session login boleh tetap disimpan per-browser karena session memang milik masing-masing pengguna.
4. Client tidak pernah membawa credential database.
5. Semua akses database dilakukan di server SvelteKit melalui Drizzle.
6. Perubahan data tetap lewat `/api/library` agar UI tidak perlu tahu apakah backend memakai file JSON atau Postgres.
7. Migrasi schema dilakukan lewat Drizzle Kit, bukan perubahan manual acak di dashboard.

### Catatan Keamanan Supabase
1. Karena akses utama memakai Drizzle server-side, tabel tidak perlu dibuka ke Supabase Data API untuk `anon`/`authenticated`.
2. Jika suatu saat tabel akan diakses langsung dari Supabase Data API, aktifkan RLS dan buat policy yang spesifik sebelum memberi `GRANT`.
3. Jangan menyimpan `DATABASE_URL`, password database, secret key, atau service role key di file client atau env `PUBLIC_*`.
4. Untuk aplikasi production, ganti auth custom berbasis password sederhana menjadi Supabase Auth atau minimal simpan password dalam bentuk hash.
5. Jika deploy ke serverless/edge dan memakai transaction pooler, pastikan prepared statements dimatikan pada client Postgres.

### Catatan Deploy
Pendekatan Supabase Postgres cocok untuk deploy yang tidak memiliki filesystem persisten, termasuk platform serverless. Data berada di database Supabase sehingga tidak hilang saat aplikasi redeploy/restart. Untuk koneksi dari runtime serverless, gunakan Connection Pooler dan konfigurasi client sesuai batasan pooler.

---

## Fitur Baru: Harga Buku dan Pembayaran Peminjaman

### Tujuan Fitur
Setiap buku memiliki harga peminjaman. Customer wajib masuk ke halaman pembayaran khusus sebelum transaksi peminjaman dibuat. Jika pembayaran berhasil, transaksi peminjaman dibuat dan stok buku dikurangi.

### Aturan Bisnis
| Aturan | Detail |
|---|---|
| Harga buku | Disimpan sebagai `price` pada `BookData` dan class `Book` |
| Satuan nominal | Rupiah, bertipe `number`, nilai minimal `0` |
| Biaya peminjaman | Sama dengan harga buku yang dipinjam (`book.price`) |
| Metode pembayaran | `cash`, `transfer`, atau `ewallet` |
| Status pembayaran peminjaman | `pending`, `paid`, atau `failed` |
| Syarat transaksi aktif | Transaksi hanya dibuat jika status pembayaran `paid` |
| Bukti pembayaran | Setiap pembayaran memiliki `paymentId` dan `paidAt` |
| Denda keterlambatan | Tetap dipisahkan dari pembayaran peminjaman agar riwayat biaya lebih jelas |

### Contoh Harga Buku Default
| Buku | Harga Peminjaman |
|---|---:|
| Bumi | Rp 12.000 |
| Filosofi Teras | Rp 10.000 |
| Laskar Pelangi | Rp 11.000 |
| Atomic Habits | Rp 15.000 |

### Class Payment
**Lokasi:** `src/lib/models/Payment.ts`

```typescript
class Payment {
  private _id: string;
  private _amount: number;
  private _method: 'cash' | 'transfer' | 'ewallet';
  private _status: 'pending' | 'paid' | 'failed';
  private _paidAt: string | null;

  get amount(): number { return this._amount; }
  get status(): 'pending' | 'paid' | 'failed' { return this._status; }
  get isPaid(): boolean { return this._status === 'paid'; }

  markPaid(): void { ... }
  markFailed(): void { ... }
}
```

### Perubahan pada Book
Field harga dibuat `private` agar hanya dapat dibaca lewat getter dan diubah lewat method yang memvalidasi nominal.

```typescript
class Book {
  private _price: number;

  get price(): number { return this._price; }

  updatePrice(price: number): void {
    if (price < 0) throw new Error('Harga buku tidak boleh negatif');
    this._price = price;
  }
}
```

### Perubahan pada BorrowRecord / BookTransaction
Transaksi peminjaman menyimpan snapshot pembayaran agar riwayat tetap konsisten walaupun harga buku berubah di kemudian hari.

```typescript
class BookTransaction {
  private _borrowPrice: number;
  private _paymentId: string;
  private _paymentMethod: 'cash' | 'transfer' | 'ewallet';
  private _paymentStatus: 'pending' | 'paid' | 'failed';
  private _paidAt: string | null;

  get borrowPrice(): number { return this._borrowPrice; }
  get paymentStatus(): string { return this._paymentStatus; }
}
```

### Alur Pembayaran Saat Pinjam Buku
1. Customer memilih buku yang tersedia.
2. Dari kartu katalog atau halaman detail, customer diarahkan ke `/books/[id]/payment`.
3. Halaman pembayaran menampilkan ringkasan buku, harga peminjaman, durasi pinjam, dan estimasi deadline pengembalian.
4. Customer memilih metode pembayaran (`cash`, `transfer`, atau `ewallet`) hanya di halaman pembayaran.
5. Sistem membuat object `Payment` dengan:
   - `amount` = `book.price`
   - `method` = metode yang dipilih
   - `status` = `pending`
6. Jika pembayaran berhasil, `Payment.markPaid()` mengisi `paidAt` dan status menjadi `paid`.
7. Sistem baru melanjutkan proses peminjaman:
   - cek role user lewat `canBorrow()`
   - cek stok buku lewat `book.isAvailable`
   - kurangi stok lewat `book.deductStock()`
   - buat transaksi peminjaman dengan snapshot `borrowPrice`, `paymentId`, `paymentMethod`, dan `paymentStatus`
8. Jika pembayaran gagal, transaksi peminjaman tidak dibuat dan stok buku tidak berubah.

### Tampilan yang Perlu Ditambahkan
| Halaman | Tambahan UI |
|---|---|
| `/books` | Badge/label harga peminjaman pada setiap kartu buku dan tombol menuju halaman pembayaran, tanpa pilihan metode pembayaran di card |
| `/books/[id]` | Harga buku, estimasi deadline, ringkasan total bayar, dan tombol menuju halaman pembayaran |
| `/books/[id]/payment` | Ringkasan buku, pilihan metode pembayaran, total bayar, dan tombol bayar + pinjam |
| `/history` | Kolom harga peminjaman, metode pembayaran, status pembayaran, dan waktu pembayaran |
| `/admin` | Total pendapatan peminjaman, daftar pembayaran berhasil/gagal, dan filter berdasarkan metode pembayaran |

### Defensive Programming untuk Data Lama
Karena data buku lama hasil migrasi dari `localStorage` atau file JSON lama belum memiliki `price`, proses `fromJSON()` wajib memberi default aman. Karena data record lama juga belum memiliki field pembayaran, transaksi lama dianggap sudah valid tanpa memaksa customer membayar ulang.

```typescript
price: data.price ?? 0,
borrowPrice: data.borrowPrice ?? data.price ?? 0,
paymentId: data.paymentId ?? null,
paymentMethod: data.paymentMethod ?? 'cash',
paymentStatus: data.paymentStatus ?? 'paid',
paidAt: data.paidAt ?? data.borrowDate
```

---

## Fitur Baru: Transaksi Buku, Deadline, dan Denda

### Tujuan Fitur
Fitur ini membuat proses peminjaman dan pengembalian buku lebih lengkap. Setiap peminjaman yang sudah dibayar dicatat sebagai transaksi, memiliki batas waktu pengembalian, dan menghasilkan biaya tambahan jika buku dikembalikan melewati deadline.

### Aturan Bisnis
| Aturan | Detail |
|---|---|
| Durasi pinjaman default | 7 hari sejak tanggal buku dipinjam |
| Deadline pinjaman | Disimpan sebagai `dueDate` pada record transaksi |
| Pembayaran awal | Wajib `paid` sebelum transaksi masuk status `borrowed` |
| Denda keterlambatan | Rp 2.000 per hari terlambat |
| Perhitungan terlambat | `lateDays = max(0, actualReturnDate - dueDate)` |
| Total denda | `fineAmount = lateDays * finePerDay` |
| Status transaksi | `borrowed`, `returned`, `overdue` (`overdue` untuk transaksi aktif yang sudah melewati `dueDate`) |
| Status pembayaran denda | `unpaid`, `paid`, atau `none` jika tidak ada denda |

### Class dan Encapsulation
**Lokasi:** `BorrowRecord.ts` atau class baru `BookTransaction.ts`

Field transaksi dibuat `private` agar data tidak bisa diubah sembarangan dari UI. Perubahan status hanya boleh lewat method class.

```typescript
class BookTransaction {
  private _borrowDate: string;
  private _dueDate: string;
  private _returnDate: string | null;
  private _borrowPrice: number;
  private _paymentStatus: 'pending' | 'paid' | 'failed';
  private _fineAmount: number;
  private _fineStatus: 'none' | 'unpaid' | 'paid';

  get dueDate(): string { return this._dueDate; }
  get borrowPrice(): number { return this._borrowPrice; }
  get paymentStatus(): 'pending' | 'paid' | 'failed' { return this._paymentStatus; }
  get fineAmount(): number { return this._fineAmount; }

  calculateLateDays(returnDate = new Date()): number { ... }
  calculateFine(returnDate = new Date()): number { ... }
  markReturned(returnDate = new Date()): void { ... }
  markFinePaid(): void { ... }
}
```

### Alur Peminjaman Buku
1. Customer memilih buku yang tersedia.
2. Customer diarahkan ke halaman `/books/[id]/payment`.
3. Customer memilih metode pembayaran dan membayar sebesar `book.price` di halaman pembayaran.
4. Sistem memastikan pembayaran peminjaman berstatus `paid`.
5. Sistem mengecek role user lewat `canBorrow()`.
6. Sistem mengecek stok buku lewat `book.isAvailable`.
7. Stok dikurangi lewat `book.deductStock()`.
8. Sistem membuat transaksi baru dengan:
   - `borrowDate` = tanggal hari ini
   - `dueDate` = `borrowDate + 7 hari`
   - `borrowPrice` = snapshot harga buku saat dipinjam
   - `paymentStatus` = `paid`
   - `status` = `borrowed`
   - `fineAmount` = `0`
   - `fineStatus` = `none`
9. Transaksi disimpan ke Supabase Postgres melalui API server setelah data class diubah menjadi plain object dengan `toJSON()`.

### Alur Pengembalian Buku
1. Customer atau admin memilih transaksi aktif.
2. Sistem memanggil `markReturned()`.
3. Method menghitung apakah pengembalian melewati `dueDate`.
4. Jika terlambat:
   - status transaksi menjadi `returned`
   - `lateDays` dihitung otomatis
   - `fineAmount` dihitung otomatis
   - `fineStatus` menjadi `unpaid`
5. Jika tidak terlambat:
   - status transaksi menjadi `returned`
   - `lateDays` = `0`
   - `fineAmount` = `0`
   - `fineStatus` = `none`
6. Stok buku dikembalikan lewat `book.restoreStock()`.

### Tampilan yang Perlu Ditambahkan
| Halaman | Tambahan UI |
|---|---|
| `/books/[id]` | Info harga, deadline estimasi, dan tombol menuju pembayaran |
| `/books/[id]/payment` | Pilihan metode pembayaran, total bayar, dan konfirmasi pinjam |
| `/history` | Kolom deadline, status terlambat, jumlah hari terlambat, harga peminjaman, status pembayaran, dan denda |
| `/admin` | Ringkasan transaksi aktif, transaksi overdue, total pembayaran peminjaman, dan total denda belum dibayar |
| Modal pengembalian | Konfirmasi denda jika buku dikembalikan melewati deadline |

### Defensive Programming untuk Data Lama
Karena data lama hasil migrasi dari `localStorage` atau file JSON lama belum memiliki field `dueDate`, `lateDays`, `fineAmount`, `fineStatus`, dan field pembayaran, proses `fromJSON()` wajib memberi default aman:

```typescript
dueDate: data.dueDate ?? addDays(data.borrowDate, 7),
lateDays: data.lateDays ?? 0,
fineAmount: data.fineAmount ?? 0,
fineStatus: data.fineStatus ?? 'none',
borrowPrice: data.borrowPrice ?? 0,
paymentStatus: data.paymentStatus ?? 'paid'
```

Dengan cara ini, data lama tetap bisa dibaca tanpa membuat aplikasi crash.

---

## Alur Kerja Eksekusi (Progress Project Saat Ini)

1. **[SELESAI]** Pembuatan Class Models: `User.ts`, `Book.ts`, `BorrowRecord.ts`.
2. **[SELESAI]** Refactor `store.svelte.ts` untuk menggunakan metode OOP penuh pada class-class tersebut.
3. **[SELESAI]** Pemisahan Routing Otentikasi: Rute login dan register kini diisolasi pada grup `(auth)`, sehingga tidak memiliki navigasi utama (Navbar).
4. **[SELESAI]** Pembuatan Routing Utama Aplikasi: Halaman `/books`, `/admin`, dan `/history` serta rute detail `/books/[id]` kini terstruktur dalam grup `(app)` untuk mewarisi layout navbar secara terpusat.
5. **[SELESAI]** Navigasi Login Adaptif: Tombol "Login" pada navigasi hanya muncul saat user belum terotentikasi, dan menghilang digantikan "Logout" setelah berhasil masuk.
6. **[SELESAI]** Keamanan Akses (Access Control): Customer biasa tidak dapat masuk ke dashboard `/admin`, dan Admin dibatasi agar tidak bisa menggunakan fitur pinjam buku.
7. **[SELESAI]** Data Integrity (Defensive Programming): Mengimplementasikan pemeriksaan ganda (misal: `record.customerEmail && ...`) pada fungsionalitas *search* di seluruh halaman (Katalog Buku, Dashboard Admin, History) untuk mencegah aplikasi crash ketika membaca data versi lama yang korup/belum lengkap.
8. **[SELESAI]** Pembersihan Antarmuka: Menghapus UI Riwayat Peminjaman dari halaman `/books/[id]` (Detail Buku) untuk tampilan yang lebih fokus dan rapi.
9. **[SELESAI]** Menambahkan harga peminjaman pada setiap data buku.
10. **[SELESAI]** Menambahkan fitur pembayaran pada halaman khusus `/books/[id]/payment`.
11. **[SELESAI]** Menambahkan fitur transaksi buku sebagai record lengkap untuk peminjaman dan pengembalian.
12. **[SELESAI]** Menambahkan deadline pinjaman otomatis dengan durasi default 7 hari.
13. **[SELESAI]** Menambahkan perhitungan denda keterlambatan berdasarkan jumlah hari terlambat.
14. **[SELESAI]** Menambahkan tampilan status pembayaran, status overdue, total pembayaran peminjaman, dan total denda pada halaman History dan Admin.
15. **[SELESAI]** Memisahkan pilihan metode pembayaran dari card katalog buku agar pembayaran hanya dilakukan di halaman pembayaran.
16. **[SELESAI]** Mengganti penyimpanan utama dari `localStorage` menjadi file JSON bersama melalui API server agar perubahan admin terlihat di browser lain.
17. **[SELESAI]** Migrasi penyimpanan utama dari file JSON server-side ke Supabase Postgres.
18. **[SELESAI]** Menambahkan Drizzle ORM, `drizzle.config.ts`, schema tabel, dan migrasi SQL.
19. **[SELESAI]** Membuat repository server-side berbasis Drizzle untuk menggantikan `libraryStorage.ts`.
20. **[SELESAI]** Membuat script seed/migrasi dari `data/library.json` lama ke tabel Supabase.
21. **[SELESAI]** Verifikasi teknis: `npm run check`, `npm run build`, dan validasi tabel Supabase lewat MCP.
22. **[PERLU ENV]** Isi `DATABASE_URL` lokal/deploy agar endpoint `/api/library` memakai Supabase dari aplikasi runtime.

---

## Kesimpulan
Arsitektur OOP telah terintegrasi dengan pendekatan fungsional/reaktif Svelte 5 (Runes) tanpa merusak UI **Neo Brutalism**. Bug kritis akibat backward-compatibility data lama telah diselesaikan melalui konsep defensif, dan aplikasi sekarang stabil sebagai fondasi untuk fitur harga buku, pembayaran peminjaman, transaksi buku, deadline pinjaman, dan denda keterlambatan. Penyimpanan utama sudah diarahkan ke Supabase Postgres dengan Drizzle ORM agar data lebih persisten, relasional, dan siap deploy; runtime aplikasi masih membutuhkan `DATABASE_URL` pada environment lokal/deploy.
