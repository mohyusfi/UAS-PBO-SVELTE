# Plan Implementasi OOP - Aplikasi Perpustakaan Neo Brutalism

## Tujuan
Mengimplementasikan 3 pilar OOP (**Encapsulation**, **Inheritance**, **Polymorphism**) ke dalam arsitektur TypeScript proyek ini. Semua perubahan dilakukan di layer `src/lib/` (logika bisnis), halaman Svelte di `src/routes/` hanya menyesuaikan import — **desain Neo Brutalism tidak berubah**.
Selain itu, menangani keamanan data (defensive programming) agar kebal terhadap struktur data lawas (legacy) pada browser pengguna.

---

## Analogi Sederhana

| Pilar OOP | Analogi | Implementasi di Proyek |
|---|---|---|
| **Encapsulation** | Brankas bank — data di dalam, akses lewat pintu kunci | Field `private`, mutasi stok terkontrol, akses via getter/method |
| **Inheritance** | Anak mewarisi sifat orang tua | `User` (parent) → `AdminUser` & `CustomerUser` (child) |
| **Polymorphism** | Tombol "Play" beda behavior di Spotify vs YouTube | Method `canBorrow()` diizinkan untuk Customer, tapi ditolak untuk Admin |

---

## Struktur File

### File yang DIUBAH
| File | Perubahan |
|---|---|
| `src/lib/types.ts` | Dihapus — diganti class OOP di `models/` |
| `src/lib/store.svelte.ts` | Refactor: pakai class model baru, mengelola instance polymorphic |
| `src/routes/(app)/*` | Penyesuaian layout, routing (seperti `/books/[id]`), dan defensive checks |

### File BARU yang DIBUAT
| File | Isi |
|---|---|
| `src/lib/models/User.ts` | Abstract class `User` + child `AdminUser`, `CustomerUser` |
| `src/lib/models/Book.ts` | Class `Book` dengan encapsulation (private fields + getter/setter) |
| `src/lib/models/BorrowRecord.ts` | Class `BorrowRecord` dengan encapsulation |
| `src/lib/models/index.ts` | Barrel export semua models |

---

## Detail Implementasi per Pilar OOP

### 1. Encapsulation
**Lokasi:** `Book.ts`, `BorrowRecord.ts`, `User.ts`
Semua properti data di-set `private`, akses lewat getter (read) dan method (write).
```typescript
class Book {
  private _id: string;
  private _title: string;
  private _stock: number;

  get title(): string { return this._title; }
  get isAvailable(): boolean { return this._stock > 0; }

  deductStock(): boolean { ... }   // controlled mutation
  restoreStock(): void { ... }     // controlled mutation
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

---

## Alur Kerja Eksekusi (Progress Project Saat Ini)

1. **[SELESAI]** Pembuatan Class Models: `User.ts`, `Book.ts`, `BorrowRecord.ts`.
2. **[SELESAI]** Refactor `store.svelte.ts` untuk menggunakan metode OOP penuh pada class-class tersebut.
3. **[SELESAI]** Pemisahan Routing Otentikasi: Rute login dan register kini diisolasi pada grup `(auth)`, sehingga tidak memiliki navigasi utama (Navbar).
4. **[SELESAI]** Pembuatan Routing Utama Aplikasi: Halaman `/books`, `/admin`, dan `/history` serta rute detail `/books/[id]` kini terstruktur dalam grup `(app)` untuk mewarisi layout navbar secara terpusat.
5. **[SELESAI]** Navigasi Login Adaptif: Tombol "Login" pada navigasi hanya muncul saat user belum terotentikasi, dan menghilang digantikan "Logout" setelah berhasil masuk.
6. **[SELESAI]** Keamanan Akses (Access Control): Customer biasa tidak dapat masuk ke dashboard `/admin`, dan Admin dibatasi agar tidak bisa menggunakan fitur pinjam buku.
7. **[SELESAI]** Data Integrity (Defensive Programming): Mengimplementasikan pemeriksaan ganda (misal: `record.customerEmail && ...`) pada fungsionalitas *search* di seluruh halaman (Katalog Buku, Dashboard Admin, History) untuk mencegah aplikasi crash ketika membaca data `localStorage` versi lama yang korup/belum lengkap.
8. **[SELESAI]** Pembersihan Antarmuka: Menghapus UI Riwayat Peminjaman dari halaman `/books/[id]` (Detail Buku) untuk tampilan yang lebih fokus dan rapi.

---

## Kesimpulan
Arsitektur OOP telah terintegrasi sukses dengan pendekatan fungsional/reaktif Svelte 5 (Runes) tanpa merusak keindahan UI **Neo Brutalism**. Bug kritis akibat backward-compatibility `localStorage` telah diselesaikan melalui konsep defensif, dan aplikasi sekarang stabil dan siap digunakan.
