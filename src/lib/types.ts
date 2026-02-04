export type DocumentStatus = 'none' | 'ready' | 'in_progress' | 'paused' | 'completed';

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  none: '상태없음',
  ready: '준비',
  in_progress: '진행중',
  paused: '일시정지',
  completed: '완료',
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  none: '#999999',
  ready: '#7EB6FF',
  in_progress: '#FFE66D',
  paused: '#FFA552',
  completed: '#7AE582',
};

export interface Document {
  id: string;
  title: string;
  content: string;
  date: number;
  status: DocumentStatus;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentInput {
  title?: string;
  content?: string;
  date?: number;
  status?: DocumentStatus;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
