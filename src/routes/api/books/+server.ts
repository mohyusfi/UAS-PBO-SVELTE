import { error, json } from '@sveltejs/kit';
import { saveBook } from '$lib/server/libraryRepository';
import type { BookData } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const book = (await request.json()) as BookData;
    return json(await saveBook(book), { status: 201 });
  } catch (err) {
    console.error(err);
    error(400, 'Data buku tidak valid.');
  }
};
