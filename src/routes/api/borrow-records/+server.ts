import { error, json } from '@sveltejs/kit';
import { saveBorrowRecord } from '$lib/server/libraryRepository';
import type { BookData, BorrowRecordData } from '$lib/types';
import type { RequestHandler } from './$types';

interface BorrowRecordPayload {
  record: BorrowRecordData;
  book?: BookData;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = (await request.json()) as BorrowRecordPayload;
    return json(await saveBorrowRecord(payload.record, payload.book), { status: 201 });
  } catch (err) {
    console.error(err);
    error(400, 'Data transaksi tidak valid.');
  }
};
