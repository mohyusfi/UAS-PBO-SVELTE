import { error, json } from '@sveltejs/kit';
import { saveCustomer } from '$lib/server/libraryRepository';
import type { CustomerData } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const customer = (await request.json()) as CustomerData;
    return json(await saveCustomer(customer), { status: 201 });
  } catch (err) {
    console.error(err);
    error(400, 'Data customer tidak valid.');
  }
};
