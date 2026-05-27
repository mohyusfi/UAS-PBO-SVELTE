# Deskripsi Proyek: NeoLib (Aplikasi Perpustakaan Neo-Brutalis)

**NeoLib** adalah sebuah aplikasi web manajemen perpustakaan modern yang dikembangkan sebagai proyek Tugas Akhir (UAS) mata kuliah Pemrograman Berorientasi Objek (PBO) Kelompok 6. Proyek ini memadukan arsitektur kode OOP klasik dengan kerangka kerja frontend modern reaktif yang dibalut dalam antarmuka desain **Neo-Brutalism**.

---

## 🚀 Teknologi Utama

1. **Framework:** SvelteKit (Svelte 5)
2. **Bahasa Pemrograman:** TypeScript
3. **Styling:** TailwindCSS
4. **State Management:** Svelte 5 Runes (`$state`, `$derived`)
5. **Penyimpanan Data:** Browser `localStorage` (Tanpa database backend terpisah, sehingga mudah dijalankan murni di sisi klien).

---

## 🏛️ Arsitektur Pemrograman Berorientasi Objek (OOP)

Aplikasi ini tidak sekadar menggunakan fungsionalitas UI biasa, melainkan menerapkan prinsip-prinsip murni *Object-Oriented Programming* (OOP) ke dalam logika bisnis intinya (`src/lib/models/`), yaitu:

*   **Encapsulation (Enkapsulasi):** Semua data penting pada entitas seperti `Book` dan `BorrowRecord` dibuat *private*. Mutasi data (seperti menambah/mengurangi stok buku) hanya bisa dilakukan melalui metode resmi yang disediakan oleh *class* tersebut (`deductStock()`, `restoreStock()`).
*   **Inheritance (Pewarisan):** Menggunakan kelas abstrak `User` sebagai kelas induk (*parent*) yang mendefinisikan kerangka profil pengguna dasar. Kelas ini kemudian diturunkan menjadi dua jenis pengguna yang berbeda spesifikasinya: `AdminUser` dan `CustomerUser`.
*   **Polymorphism (Polimorfisme):** Implementasi fungsi `canBorrow()` pada kelas turunan yang memiliki *behavior* (perilaku) berbeda. `CustomerUser` akan mengembalikan nilai `true` (dapat meminjam), sedangkan `AdminUser` mengembalikan `false` (admin tidak difungsikan untuk meminjam buku).

---

## ✨ Fitur-Fitur Utama

### 1. Desain Neo-Brutalism yang Estetik
Antarmuka pengguna didesain menggunakan gaya Neo-Brutalism yang ditandai dengan garis batas (border) tebal, bayangan padat yang tajam (*hard shadows*), palet warna-warni kontras tinggi, dan elemen tipografi besar (*bold*). Hal ini memberikan kesan *playful*, *edgy*, dan sangat berani.

### 2. Sistem Autentikasi dan Otorisasi Berbasis Peran
*   **Admin (Pengelola):** Login menggunakan kredensial rahasia (disimpan aman di *Environment Variables* / `.env`). Admin memiliki akses penuh ke "Kontrol Utama Admin" untuk menambah, mengedit, dan menghapus inventaris buku, serta memantau semua riwayat peminjaman dari semua pelanggan.
*   **Customer (Pelanggan):** Dapat mendaftar (*register*) akun baru, menjelajahi katalog buku, meminjam buku secara langsung, serta melacak daftar buku yang sedang mereka pinjam dan riwayat pribadi.
*   **Pengamanan Rute (Route Protection):** Akses dibatasi ketat berdasarkan peran. Customer tidak dapat menyusup ke halaman Admin, dan antarmuka akan menyesuaikan sendiri (*adaptive navbar*).

### 3. Manajemen Perpustakaan Real-time
*   **Katalog Interaktif:** Fitur pencarian buku berdasarkan judul, penulis, ISBN, atau Kategori.
*   **Sistem Peminjaman Akurat:** Sistem melacak status stok buku (*inventory*). Pengguna tidak dapat meminjam jika stok habis (0) atau jika pengguna masih berstatus sedang meminjam buku yang sama.
*   **Defensive Data Handling:** Dilengkapi proteksi keamanan lapis ganda terhadap data lama (*legacy browser history*) yang mungkin korup, menjamin aplikasi tidak akan pernah mengalami *crash* karena konflik format data.

---

## 📁 Struktur Direktori Penting

*   `/src/lib/models/` : Berisi representasi Blueprint OOP murni (Class `Book`, `User`, `BorrowRecord`).
*   `/src/lib/store.svelte.ts` : Berfungsi sebagai *Singleton Object* / Pengendali Pusat yang menjembatani model OOP dengan UI menggunakan reaktivitas murni Svelte 5.
*   `/src/routes/(app)/` : Halaman-halaman utama (Beranda, Katalog, Admin, History) yang mewarisi layout dengan bar navigasi.
*   `/src/routes/(auth)/` : Halaman yang terisolasi khusus untuk proses Login dan Registrasi agar bebas dari gangguan visual (tanpa navbar).

---

**Status Proyek:** Stabil, terselesaikan secara fungsional, dan siap pakai secara lokal. Dibuat untuk memenuhi kualifikasi implementasi logika PBO / OOP dalam kerangka pengembangan web modern.
