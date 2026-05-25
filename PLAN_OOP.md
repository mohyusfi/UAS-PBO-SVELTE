# Plan Implementasi OOP - Aplikasi Perpustakaan Neo Brutalism

## Tujuan
Mengimplementasikan 3 pilar OOP (**Encapsulation**, **Inheritance**, **Polymorphism**) ke dalam
arsitektur TypeScript proyek ini. Semua perubahan dilakukan di layer `src/lib/` (logika bisnis),
halaman Svelte di `src/routes/` hanya menyesuaikan import — **desain Neo Brutalism tidak berubah**.

---

## Analogi Sederhana

| Pilar OOP | Analogi | Implementasi di Proyek |
|---|---|---|
| **Encapsulation** | Brankas bank — data di dalam, akses lewat pintu kunci | Field `private`, akses via getter/method |
| **Inheritance** | Anak mewarisi sifat orang tua | `User` (parent) → `AdminUser` & `CustomerUser` (child) |
| **Polymorphism** | Tombol "Play" beda behavior di Spotify vs YouTube | Method `getDisplayInfo()` beda output di Admin vs Customer |

---

## Struktur File

### File yang DIUBAH
| File | Perubahan |
|---|---|
| `src/lib/types.ts` | Dihapus — diganti class OOP di `models/` |
| `src/lib/store.svelte.ts` | Refactor: pakai class model baru, method tetap sama |
| `src/lib/schema.ts` | Tetap (validasi Zod tidak berubah) |

### File BARU yang dibuat
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
// Contoh: Book.ts
class Book {
  private _id: string;
  private _title: string;
  private _stock: number;

  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get stock(): number { return this._stock; }
  get isAvailable(): boolean { return this._stock > 0; }

  deductStock(): boolean { ... }   // controlled mutation
  restoreStock(): void { ... }     // controlled mutation
  toJSON(): BookData { ... }       // serialization untuk localStorage
}
```

### 2. Inheritance
**Lokasi:** `User.ts`

```
     ┌──────────────┐
     │  User (base)  │  ← abstract class
     │ email, name   │
     │ getRole()     │  ← abstract method
     └──────┬───────┘
            │
     ┌──────┴───────┐
     │              │
┌────▼─────┐  ┌────▼──────┐
│ AdminUser │  │CustomerUser│
│ role=admin│  │role=customer│
│ canManage │  │ canBorrow  │
└──────────┘  └───────────┘
```

- `User` = abstract class dengan shared properties (email, username) dan abstract method
- `AdminUser` extends `User` → implements admin-specific logic
- `CustomerUser` extends `User` → implements customer-specific logic

### 3. Polymorphism
**Lokasi:** `User.ts` → method `getDisplayInfo()` dan `getRole()`

```typescript
abstract class User {
  abstract getRole(): 'admin' | 'customer';
  abstract getDisplayInfo(): string;   // polymorphic
  abstract canBorrow(): boolean;       // polymorphic
}

class AdminUser extends User {
  getRole() { return 'admin' as const; }
  getDisplayInfo() { return `Admin: ${this.username}`; }
  canBorrow() { return false; }  // Admin tidak bisa pinjam
}

class CustomerUser extends User {
  getRole() { return 'customer' as const; }
  getDisplayInfo() { return `Customer: ${this.username}`; }
  canBorrow() { return true; }   // Customer bisa pinjam
}
```

Ini menunjukkan **polymorphism** — method sama (`getDisplayInfo`, `canBorrow`) tapi behavior berbeda tergantung tipe user.

---

## Perubahan di store.svelte.ts

Store tetap jadi **satu-satunya class dengan `$state`** (Svelte 5 runes).
Perbedaannya:
- `session` menyimpan instance `User` (bukan plain object)
- Book CRUD menggunakan method dari class `Book`
- Borrow/return menggunakan method dari class `BorrowRecord`
- Login/register membuat instance `AdminUser` atau `CustomerUser`

---

## Alur Kerja Eksekusi

1. **[SELESAI]** Buat `src/lib/models/User.ts` → abstract + 2 child classes
2. **[SELESAI]** Buat `src/lib/models/Book.ts` → encapsulated book
3. **[SELESAI]** Buat `src/lib/models/BorrowRecord.ts` → encapsulated record
4. **[SELESAI]** Buat `src/lib/models/index.ts` → barrel export
5. **[SELESAI]** Update `src/lib/types.ts` → tambah interface data (untuk JSON serialization)
6. **[SELESAI]** Refactor `src/lib/store.svelte.ts` → gunakan class model baru
7. **[SELESAI]** Update halaman Svelte → sesuaikan akses property (getter)
8. **[SELESAI]** Pindahkan rute `admin` ke dalam grup `(app)/admin` agar mewarisi layout navbar (mendapat margin dan tombol logout).
9. **[SELESAI]** Verifikasi → `npm run check` dan `npm run build` berhasil tanpa error.

---

## Catatan
- Desain Neo Brutalism di Svelte components **TIDAK berubah sama sekali**
- Semua OOP murni di layer TypeScript (`src/lib/models/`)
- Store tetap singleton pattern (sudah OOP dari awal)
