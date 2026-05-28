import type { PaymentData, PaymentMethod, PaymentStatus } from '../types';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function createPaymentId(): string {
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class Payment {
  private _id: string;
  private _amount: number;
  private _method: PaymentMethod;
  private _status: PaymentStatus;
  private _paidAt: string | null;

  constructor(data: PaymentData) {
    this._id = data.id;
    this._amount = Math.max(0, Math.round(Number(data.amount) || 0));
    this._method = data.method;
    this._status = data.status;
    this._paidAt = data.paidAt;
  }

  get id(): string { return this._id; }
  get amount(): number { return this._amount; }
  get method(): PaymentMethod { return this._method; }
  get status(): PaymentStatus { return this._status; }
  get paidAt(): string | null { return this._paidAt; }

  get isPaid(): boolean {
    return this._status === 'paid';
  }

  markPaid(paymentDate = todayISO()): void {
    this._status = 'paid';
    this._paidAt = paymentDate;
  }

  markFailed(): void {
    this._status = 'failed';
    this._paidAt = null;
  }

  toJSON(): PaymentData {
    return {
      id: this._id,
      amount: this._amount,
      method: this._method,
      status: this._status,
      paidAt: this._paidAt
    };
  }

  static create(amount: number, method: PaymentMethod): Payment {
    return new Payment({
      id: createPaymentId(),
      amount,
      method,
      status: 'pending',
      paidAt: null
    });
  }

  static fromJSON(data: PaymentData): Payment {
    return new Payment(data);
  }
}
