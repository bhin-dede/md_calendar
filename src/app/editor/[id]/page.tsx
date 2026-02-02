'use client';

import { use, Suspense } from 'react';
import { Editor } from '@/components/editor/Editor';

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

function EditorContent({ documentId }: { documentId: string }) {
  return <Editor documentId={documentId} />;
}

export default function EditorWithIdPage({ params }: EditorPageProps) {
  const { id } = use(params);
  
  return (
    <Suspense fallback={<div className="app-container view-editor"><div className="loading">Loading...</div></div>}>
      <EditorContent documentId={id} />
    </Suspense>
  );
}
