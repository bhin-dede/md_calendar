'use client';

import { Suspense } from 'react';
import { Editor } from '@/components/editor/Editor';

function EditorContent() {
  return <Editor />;
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="app-container view-editor"><div className="loading">Loading...</div></div>}>
      <EditorContent />
    </Suspense>
  );
}
