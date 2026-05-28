# Plan Implementasi OOP - Aplikasi Perpustakaan Neo Brutalism

## Tujuan
Mengimplementasikan 3 pilar OOP (**Encapsulation**, **Inheritance**, **Polymorphism**) ke dalam arsitektur TypeScript proyek ini. Semua perubahan dilakukan di layer `src/lib/` (logika bisnis), halaman Svelte di `src/routes/` hanya menyesuaikan import — **desain Neo Brutalism tidak berubah**.
Selain itu, menangani keamanan data (defensive programming) agar kebal terhadap struktur data lawas (legacy) dan memindahkan penyimpanan utama dari `localStorage` ke file JSON bersama di sisi server aplikasi.
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
| `src/lib/types.ts` | Interface serialisasi JSON untuk data buku, customer, transaksi, pembayaran, deadline, status pembayaran denda, dan nominal denda |
| `src/lib/store.svelte.ts` | Refactor: pakai class model baru, mengelola instance polymorphic, validasi pembayaran sebelum peminjaman, dan sinkronisasi data lewat API server |
| `src/routes/api/library/+server.ts` | Endpoint server untuk membaca dan menyimpan data perpustakaan bersama dari file JSON |
| `src/lib/server/libraryStorage.ts` | Helper server-side untuk read/write file JSON secara aman tanpa database |
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
| `data/library.json` | File JSON bersama untuk menyimpan `books`, `customers`, dan `borrowRecords` agar data sama di semua browser |

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
- Data utama tidak lagi disimpan ke `localStorage`; store mengambil data dari endpoint `/api/library` dan menyimpan perubahan lewat request ke server.
- Setiap data buku memiliki `price` sebagai biaya peminjaman yang wajib dibayar customer sebelum transaksi aktif.
- Transaksi buku dibuat saat customer berhasil meminjam buku, lalu disimpan sebagai record aktif.
- `borrowBook()` dipanggil dari halaman pembayaran, menerima metode pembayaran, memvalidasi pembayaran, lalu menghitung `borrowDate` dan `dueDate` otomatis berdasarkan durasi pinjaman.
- `returnBook()` menghitung keterlambatan sebelum menutup transaksi dan mengembalikan stok buku.
- Store menyediakan derived data untuk transaksi aktif, transaksi terlambat, riwayat transaksi, total pembayaran peminjaman, dan total denda customer.

---

## Perubahan Penyimpanan: JSON Server-Side Tanpa Database

### Masalah Saat Ini
`localStorage` hanya tersimpan di browser masing-masing. Jika admin menambahkan buku dari Browser A, Browser B tidak otomatis memiliki data tersebut karena Browser B membaca `localStorage` miliknya sendiri.

### Solusi yang Dipakai
Gunakan satu file JSON bersama di sisi server aplikasi, bukan database. Semua browser membaca dan menulis data melalui API SvelteKit sehingga sumber datanya sama.

| Komponen | Peran |
|---|---|
| `data/library.json` | Penyimpanan utama bersama untuk data buku, customer, dan transaksi |
| `src/lib/server/libraryStorage.ts` | Membaca file JSON, memberi default data awal, validasi bentuk data, dan menulis ulang file secara aman |
| `src/routes/api/library/+server.ts` | API `GET` untuk mengambil semua data dan `PUT`/`PATCH` untuk menyimpan perubahan |
| `src/lib/store.svelte.ts` | Client store melakukan `fetch('/api/library')`, mengubah plain JSON menjadi instance class, lalu menyimpan perubahan lewat API |

### Struktur Data File JSON
```json
{
  "books": [],
  "customers": [],
  "borrowRecords": []
}
```

### Aturan Penyimpanan
1. `localStorage` tidak dipakai untuk data utama seperti buku, customer, dan transaksi.
2. Session login boleh tetap disimpan per-browser karena session memang milik masing-masing pengguna.
3. Setelah admin menambah/mengubah/menghapus buku, store mengirim data terbaru ke `/api/library`.
4. Browser lain mengambil data terbaru dari `/api/library` saat halaman dibuka, saat tombol refresh data ditekan, atau lewat polling ringan berkala.
5. Penulisan file dilakukan server dengan alur read -> validasi -> write temp file -> rename agar file JSON tidak mudah korup saat proses tulis.
6. Tidak ada database, ORM, atau koneksi server database.

### Dampak ke Alur Admin
1. Admin di Browser A menambah buku.
2. Store mengubah instance `Book`, lalu mengirim hasil `toJSON()` ke endpoint server.
3. Server menyimpan data ke `data/library.json`.
4. Browser B memanggil `GET /api/library` dan mendapatkan daftar buku terbaru dari file yang sama.

### Catatan Deploy
Pendekatan file JSON cocok untuk aplikasi tugas, demo lokal, atau server Node yang punya akses tulis ke filesystem. Jika aplikasi dideploy ke platform serverless yang filesystem-nya tidak persisten, data dapat hilang setelah redeploy/restart. Batasan ini bukan database, tetapi konsekuensi penyimpanan berbasis file.

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
9. Transaksi disimpan ke file JSON bersama melalui API server setelah data class diubah menjadi plain object dengan `toJSON()`.

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
16. **[SELESAI]** Mengganti penyimpanan utama dari `localStorage` menjadi file JSON bersama melalui API server agar perubahan admin terlihat di browser lain tanpa memakai database.

---

## Kesimpulan
Arsitektur OOP telah terintegrasi sukses dengan pendekatan fungsional/reaktif Svelte 5 (Runes) tanpa merusak keindahan UI **Neo Brutalism**. Bug kritis akibat backward-compatibility data lama telah diselesaikan melalui konsep defensif, dan aplikasi sekarang stabil sebagai fondasi untuk fitur harga buku, pembayaran peminjaman, transaksi buku, deadline pinjaman, denda keterlambatan, serta penyimpanan bersama berbasis file JSON server-side tanpa database.
