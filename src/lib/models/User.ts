import type { UserSessionData } from '../types';

export abstract class User {
  private _username: string;
  private _email: string;

  constructor(username: string, email: string) {
    this._username = username;
    this._email = email;
  }

  
  get username(): string {
    return this._username;
  }

  get email(): string {
    return this._email;
  }

  abstract getRole(): 'admin' | 'customer';
  abstract getDisplayInfo(): string;
  abstract canBorrow(): boolean;
  abstract canManageBooks(): boolean;

 
  toSessionData(): UserSessionData {
    return {
      username: this._username,
      email: this._email,
      role: this.getRole()
    };
  }


  static fromSessionData(data: UserSessionData): User {
    if (data.role === 'admin') {
      return new AdminUser(data.username, data.email);
    }
    return new CustomerUser(data.username, data.email);
  }
}


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


export class CustomerUser extends User {
  getRole(): 'customer' {
    return 'customer';
  }

  getDisplayInfo(): string {
    return `👤 Customer: ${this.username}`;
  }

  canBorrow(): boolean {
    return true;
  }

  canManageBooks(): boolean {
    return false;
  }
}
