'use client';

import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { getDocumentsFolder, setDocumentsFolder } from '@/lib/db';
import { useToast } from '@/context/ToastContext';

export default function SettingsPage() {
  const [folder, setFolder] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadFolder();
  }, []);

  const loadFolder = async () => {
    try {
      const savedFolder = await getDocumentsFolder();
      setFolder(savedFolder || '(기본 위치: ~/.local/share/com.mdcalendar.app/documents)');
    } catch (error) {
      console.error('Failed to load folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '문서 저장 폴더 선택',
      });

      if (selected && typeof selected === 'string') {
        await setDocumentsFolder(selected);
        setFolder(selected);
        showToast('저장 폴더가 변경되었습니다', 'success');
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
      showToast('폴더 선택에 실패했습니다', 'error');
    }
  };

  return (
    <div className="app-container view-settings">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        
        <div className="settings-section">
          <h2 className="settings-section-title">문서 저장 위치</h2>
          <p className="settings-description">
            마크다운 문서가 저장될 폴더를 선택하세요.
          </p>
          
          <div className="settings-folder">
            <div className="folder-path">
              {loading ? '로딩 중...' : folder}
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleSelectFolder}
              disabled={loading}
            >
              폴더 선택
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
