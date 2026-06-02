import type { UserSessionData } from '../types';

export abstract class User {
  constructor(
    private readonly _username: string,
    private readonly _email: string
  ) {}

  get username(): string {
    return this._username;
  }

  get email(): string {
    return this._email;
  }

  abstract getRole(): UserSessionData['role'];
  abstract canBorrow(): boolean;
  abstract canManageBooks(): boolean;

  getDisplayInfo(): string {
    const label = this.getRole() === 'admin' ? 'Admin' : 'Customer';
    return `👤 ${label}: ${this.username}`;
  }

  toSessionData(): UserSessionData {
    return {
      username: this.username,
      email: this.email,
      role: this.getRole()
    };
  }

  static fromSessionData(data: UserSessionData): User {
    return data.role === 'admin'
      ? new AdminUser(data.username, data.email)
      : new CustomerUser(data.username, data.email);
  }
}

export class AdminUser extends User {
  getRole(): 'admin' {
    return 'admin';
  }

  canBorrow(): boolean {
    return false;
  }

  canManageBooks(): boolean {
    return true;
  }
}

export class CustomerUser extends User {
  getRole(): 'customer' {
    return 'customer';
  }

  canBorrow(): boolean {
    return true;
  }

  canManageBooks(): boolean {
    return false;
  }
}
