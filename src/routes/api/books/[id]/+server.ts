import { error, json } from '@sveltejs/kit';
import { deleteBook, saveBook } from '$lib/server/libraryRepository';
import type { BookData } from '$lib/types';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const book = (await request.json()) as BookData;
    return json(await saveBook({ ...book, id: params.id }));
  } catch (err) {
    console.error(err);
    error(400, 'Data buku tidak valid.');
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await deleteBook(params.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    error(400, 'Buku gagal dihapus.');
  }
};
