'use client';

import { useState } from 'react';
import { AppList } from '@/components/AppList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Info as InfoIcon, Search, Filter } from 'lucide-react';
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
    <div className="h-screen flex flex-col p-8 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex-none mb-8">
        <div className="flex items-start justify-between">
            <div>
            <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">APP</h1>
                <InfoIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
                管理您的应用程序。
            </p>
            </div>
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2 shadow-sm" size="lg">
                <Plus className="h-5 w-5" />
                上传 APP
            </Button>
        </div>

        <div className="flex items-center gap-4 mt-6">
            <div className="relative w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="搜索 APP..." 
                    className="pl-9 bg-background shadow-sm"
                />
            </div>
            <Button variant="outline" className="gap-2 border-dashed shadow-sm">
                <Filter className="h-4 w-4" />
                筛选
            </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden min-h-0 bg-background rounded-lg border shadow-sm">
        <AppList key={refreshKey} />
      </div>

      <AppUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
