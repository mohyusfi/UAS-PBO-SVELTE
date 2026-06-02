import type { BookData } from '../types';

type EditableBookFields = Partial<Omit<BookData, 'id' | 'borrowedCount'>>;

function normalizeNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : 0;
}

export class Book {
  private data: BookData;

  constructor(data: BookData) {
    this.data = {
      ...data,
      price: normalizeNumber(data.price),
      stock: normalizeNumber(data.stock),
      borrowedCount: normalizeNumber(data.borrowedCount)
    };
  }

  get id(): string { return this.data.id; }
  get title(): string { return this.data.title; }
  get author(): string { return this.data.author; }
  get isbn(): string { return this.data.isbn; }
  get description(): string { return this.data.description; }
  get category(): string { return this.data.category; }
  get coverUrl(): string { return this.data.coverUrl; }
  get price(): number { return this.data.price; }
  get stock(): number { return this.data.stock; }
  get borrowedCount(): number { return this.data.borrowedCount; }

  get isAvailable(): boolean {
    return this.data.stock > 0;
  }

  deductStock(): boolean {
    if (!this.isAvailable) return false;

    this.data.stock -= 1;
    this.data.borrowedCount += 1;
    return true;
  }

  restoreStock(): void {
    this.data.stock += 1;
  }

  updatePrice(price: number): void {
    this.data.price = normalizeNumber(price);
  }

  updateDetails(fields: EditableBookFields): void {
    this.data = {
      ...this.data,
      ...fields,
      price: fields.price === undefined ? this.data.price : normalizeNumber(fields.price),
      stock: fields.stock === undefined ? this.data.stock : normalizeNumber(fields.stock)
    };
  }

  toJSON(): BookData {
    return { ...this.data };
  }

  static fromJSON(data: BookData): Book {
    return new Book(data);
  }
}
