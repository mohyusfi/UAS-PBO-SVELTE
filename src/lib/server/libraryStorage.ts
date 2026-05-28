import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createDefaultLibraryData } from '$lib/defaultLibraryData';
import type { LibraryData, LibraryDataPatch } from '$lib/types';

const DATA_PATH = join(process.cwd(), 'data', 'library.json');

let writeQueue = Promise.resolve();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeLibraryData(value: unknown): LibraryData {
  const defaults = createDefaultLibraryData();

  if (!isObject(value)) {
    return defaults;
  }

  return {
    books: Array.isArray(value.books) ? value.books : defaults.books,
    customers: Array.isArray(value.customers) ? value.customers : defaults.customers,
    borrowRecords: Array.isArray(value.borrowRecords) ? value.borrowRecords : defaults.borrowRecords
  } as LibraryData;
}

function normalizePatch(value: unknown): LibraryDataPatch {
  if (!isObject(value)) {
    return {};
  }

  return {
    ...(Array.isArray(value.books) ? { books: value.books as LibraryData['books'] } : {}),
    ...(Array.isArray(value.customers) ? { customers: value.customers as LibraryData['customers'] } : {}),
    ...(Array.isArray(value.borrowRecords)
      ? { borrowRecords: value.borrowRecords as LibraryData['borrowRecords'] }
      : {})
  };
}

async function writeLibraryData(data: LibraryData): Promise<LibraryData> {
  const normalized = normalizeLibraryData(data);
  await mkdir(dirname(DATA_PATH), { recursive: true });

  const tempPath = `${DATA_PATH}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  await rename(tempPath, DATA_PATH);

  return normalized;
}

export async function readLibraryData(): Promise<LibraryData> {
  try {
    const file = await readFile(DATA_PATH, 'utf8');
    return normalizeLibraryData(JSON.parse(file));
  } catch (error) {
    if (isObject(error) && error.code === 'ENOENT') {
      return writeLibraryData(createDefaultLibraryData());
    }

    return createDefaultLibraryData();
  }
}

export async function replaceLibraryData(data: unknown): Promise<LibraryData> {
  const operation = writeQueue.then(() => writeLibraryData(normalizeLibraryData(data)));
  writeQueue = operation.then(
    () => undefined,
    () => undefined
  );

  return operation;
}

export async function patchLibraryData(patch: unknown): Promise<LibraryData> {
  const operation = writeQueue.then(async () => {
    const current = await readLibraryData();
    return writeLibraryData({
      ...current,
      ...normalizePatch(patch)
    });
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined
  );

  return operation;
}
