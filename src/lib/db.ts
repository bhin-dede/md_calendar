import { Document, DocumentInput, DocumentSummary } from './types';
import { invoke } from '@tauri-apps/api/core';

export async function initDB(): Promise<void> {
}

export async function createDocument(data: DocumentInput = {}): Promise<Document> {
  const now = Date.now();
  return invoke<Document>('create_document', {
    title: data.title || 'Untitled',
    content: data.content || '',
    date: data.date || now,
    status: data.status || 'none',
  });
}

export async function getDocument(id: string): Promise<Document | undefined> {
  const result = await invoke<Document | null>('get_document', { id });
  return result ?? undefined;
}

export async function updateDocument(id: string, updates: Partial<DocumentInput>): Promise<Document> {
  return invoke<Document>('update_document', {
    id,
    title: updates.title ?? null,
    content: updates.content ?? null,
    date: updates.date ?? null,
    status: updates.status ?? null,
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await invoke<boolean>('delete_document', { id });
}

export async function getAllDocuments(): Promise<Document[]> {
  return invoke<Document[]>('get_all_documents');
}

export async function getAllDocumentSummaries(): Promise<DocumentSummary[]> {
  return invoke<DocumentSummary[]>('get_all_document_summaries');
}

export async function getDocumentsForMonth(year: number, month: number): Promise<Document[]> {
  return invoke<Document[]>('get_documents_for_month', { year, month: month + 1 });
}

export async function getDocumentSummariesForMonth(year: number, month: number): Promise<DocumentSummary[]> {
  return invoke<DocumentSummary[]>('get_document_summaries_for_month', { year, month: month + 1 });
}

export async function searchDocuments(query: string): Promise<Document[]> {
  return invoke<Document[]>('search_documents', { query });
}

export async function searchDocumentSummaries(query: string): Promise<DocumentSummary[]> {
  return invoke<DocumentSummary[]>('search_document_summaries', { query });
}

export async function getDocumentsFolder(): Promise<string | null> {
  return invoke<string | null>('get_documents_folder');
}

export async function setDocumentsFolder(folder: string): Promise<void> {
  await invoke<void>('set_documents_folder', { folder });
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
