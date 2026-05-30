import { json } from '@sveltejs/kit';
import { readLibraryData } from '$lib/server/libraryRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json(await readLibraryData());
};
