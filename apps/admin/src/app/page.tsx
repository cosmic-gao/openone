'use client';

import { useState } from 'react';
import { AppList } from '@/components/AppList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AppUploadModal } from '@/components/AppUploadModal';

/**
 * APP管理首页 - 展示已注册APP列表
 */
export default function AdminPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  // Key to force refresh list
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">APP 管理</h1>
        <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            上传APP
        </Button>
      </div>
      
      <AppList key={refreshKey} />

      <AppUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
