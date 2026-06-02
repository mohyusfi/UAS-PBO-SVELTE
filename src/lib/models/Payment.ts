import type { PaymentData, PaymentMethod, PaymentStatus } from '../types';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function createPaymentId(): string {
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAmount(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : 0;
}

export class Payment {
  private data: PaymentData;

  constructor(data: PaymentData) {
    this.data = {
      ...data,
      amount: normalizeAmount(data.amount)
    };
  }

  get id(): string { return this.data.id; }
  get amount(): number { return this.data.amount; }
  get method(): PaymentMethod { return this.data.method; }
  get status(): PaymentStatus { return this.data.status; }
  get paidAt(): string | null { return this.data.paidAt; }

  get isPaid(): boolean {
    return this.data.status === 'paid';
  }

  markPaid(paymentDate = todayISO()): void {
    this.data.status = 'paid';
    this.data.paidAt = paymentDate;
  }

  markFailed(): void {
    this.data.status = 'failed';
    this.data.paidAt = null;
  }

  toJSON(): PaymentData {
    return { ...this.data };
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
