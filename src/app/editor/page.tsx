'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Editor } from '@/components/editor/Editor';

function EditorContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id') || undefined;
  
  return <Editor documentId={documentId} />;
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="app-container view-editor"><div className="loading">Loading...</div></div>}>
      <EditorContent />
    </Suspense>
  );
}
