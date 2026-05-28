import { error, json } from '@sveltejs/kit';
import { patchLibraryData, readLibraryData, replaceLibraryData } from '$lib/server/libraryStorage';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json(await readLibraryData());
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    return json(await replaceLibraryData(body));
  } catch {
    error(400, 'Payload data perpustakaan tidak valid.');
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    return json(await patchLibraryData(body));
  } catch {
    error(400, 'Payload data perpustakaan tidak valid.');
  }
};
