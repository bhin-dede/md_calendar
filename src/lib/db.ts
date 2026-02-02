import { Document, DocumentInput } from './types';

const DB_NAME = 'MDCalendarDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

let dbInstance: IDBDatabase | null = null;

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('title', 'title', { unique: false });
      }
    };
  });
}

async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance!;
}

export async function createDocument(data: DocumentInput = {}): Promise<Document> {
  const db = await getDB();
  const now = Date.now();

  const doc: Document = {
    id: generateId(),
    title: data.title || 'Untitled',
    content: data.content || '',
    date: data.date || now,
    createdAt: now,
    updatedAt: now,
  };

  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  await promisifyRequest(store.add(doc));
  return doc;
}

export async function getDocument(id: string): Promise<Document | undefined> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return promisifyRequest(store.get(id));
}

export async function updateDocument(id: string, updates: Partial<DocumentInput>): Promise<Document> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const doc = await promisifyRequest<Document>(store.get(id));
  if (!doc) throw new Error(`Document ${id} not found`);

  const updatedDoc: Document = {
    ...doc,
    ...updates,
    id: doc.id,
    createdAt: doc.createdAt,
    updatedAt: Date.now(),
  };

  const putTransaction = db.transaction([STORE_NAME], 'readwrite');
  const putStore = putTransaction.objectStore(STORE_NAME);
  await promisifyRequest(putStore.put(updatedDoc));

  return updatedDoc;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  await promisifyRequest(store.delete(id));
}

export async function getAllDocuments(): Promise<Document[]> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  const docs = await promisifyRequest<Document[]>(store.getAll());
  return docs.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getDocumentsByDateRange(startDate: number, endDate: number): Promise<Document[]> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('date');

  const range = IDBKeyRange.bound(startDate, endDate, false, false);
  return promisifyRequest(index.getAll(range));
}

export async function getDocumentsForMonth(year: number, month: number): Promise<Document[]> {
  const startDate = new Date(year, month, 1).getTime();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
  return getDocumentsByDateRange(startDate, endDate);
}

export async function searchDocuments(query: string): Promise<Document[]> {
  const docs = await getAllDocuments();
  const lowerQuery = query.toLowerCase();

  return docs.filter(doc =>
    doc.title.toLowerCase().includes(lowerQuery) ||
    doc.content.toLowerCase().includes(lowerQuery)
  );
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export { initDB };
