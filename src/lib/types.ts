export interface Document {
  id: string;
  title: string;
  content: string;
  date: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentInput {
  title?: string;
  content?: string;
  date?: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
