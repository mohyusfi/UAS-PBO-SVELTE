import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' })
});

export type LoginFields = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username minimal 3 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' })
});

export type RegisterFields = z.infer<typeof registerSchema>;

export const bookSchema = z.object({
  title: z.string().min(2, { message: 'Judul minimal 2 karakter' }),
  author: z.string().min(2, { message: 'Penulis minimal 2 karakter' }),
  isbn: z.string().min(5, { message: 'ISBN minimal 5 karakter' }),
  description: z.string().min(10, { message: 'Deskripsi minimal 10 karakter' }),
  category: z.string().min(2, { message: 'Kategori harus dipilih' }),
  coverUrl: z.string().url({ message: 'URL Cover harus berupa link URL yang valid' }).or(z.string().length(0)),
  stock: z.number().int().min(0, { message: 'Stok tidak boleh negatif' })
});

export type BookFields = z.infer<typeof bookSchema>;

