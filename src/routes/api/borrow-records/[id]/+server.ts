import { error, json } from '@sveltejs/kit';
import { saveBorrowRecord } from '$lib/server/libraryRepository';
import type { BookData, BorrowRecordData } from '$lib/types';
import type { RequestHandler } from './$types';

interface BorrowRecordPayload {
  record: BorrowRecordData;
  book?: BookData;
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const payload = (await request.json()) as BorrowRecordPayload;
    return json(await saveBorrowRecord({ ...payload.record, id: params.id }, payload.book));
  } catch (err) {
    console.error(err);
    error(400, 'Data transaksi tidak valid.');
  }
};
