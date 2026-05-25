// ============================================================
// USER.ts — Inheritance & Polymorphism
// ============================================================
// Abstract class User → AdminUser, CustomerUser
// 
// Inheritance : AdminUser & CustomerUser mewarisi User
// Polymorphism: getRole(), getDisplayInfo(), canBorrow()
//               punya behavior berbeda di tiap child class
// Encapsulation: private fields, akses via getter
// ============================================================

import type { UserSessionData } from '../types';

/**
 * Abstract base class untuk semua user di sistem perpustakaan.
 * Tidak bisa di-instantiate langsung — harus lewat child class.
 */
export abstract class User {
  private _username: string;
  private _email: string;

  constructor(username: string, email: string) {
    this._username = username;
    this._email = email;
  }

  // --- Encapsulation: Getter (read-only access) ---
  get username(): string {
    return this._username;
  }

  get email(): string {
    return this._email;
  }

  // --- Polymorphism: Abstract methods (wajib di-override child) ---
  abstract getRole(): 'admin' | 'customer';
  abstract getDisplayInfo(): string;
  abstract canBorrow(): boolean;
  abstract canManageBooks(): boolean;

  /**
   * Serialize ke plain object untuk disimpan di localStorage.
   */
  toSessionData(): UserSessionData {
    return {
      username: this._username,
      email: this._email,
      role: this.getRole()
    };
  }

  /**
   * Factory method — buat instance User dari data session yang tersimpan.
   * Ini contoh polymorphism: satu method, return tipe yang berbeda.
   */
  static fromSessionData(data: UserSessionData): User {
    if (data.role === 'admin') {
      return new AdminUser(data.username, data.email);
    }
    return new CustomerUser(data.username, data.email);
  }
}

/**
 * AdminUser — mewarisi User.
 * Admin bisa kelola buku, TIDAK bisa pinjam buku.
 */
export class AdminUser extends User {
  getRole(): 'admin' {
    return 'admin';
  }

  getDisplayInfo(): string {
    return `👤 Admin: ${this.username}`;
  }

  canBorrow(): boolean {
    return false; // Admin tidak boleh pinjam buku
  }

  canManageBooks(): boolean {
    return true; // Admin boleh CRUD buku
  }
}

/**
 * CustomerUser — mewarisi User.
 * Customer bisa pinjam buku, TIDAK bisa kelola katalog.
 */
export class CustomerUser extends User {
  getRole(): 'customer' {
    return 'customer';
  }

  getDisplayInfo(): string {
    return `👤 Customer: ${this.username}`;
  }

  canBorrow(): boolean {
    return true; // Customer boleh pinjam buku
  }

  canManageBooks(): boolean {
    return false; // Customer tidak boleh CRUD buku
  }
}
