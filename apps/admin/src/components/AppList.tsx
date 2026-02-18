'use client';

import { useEffect, useState } from 'react';
import type { AppRegistration } from '@openone/types';
import { Package, Settings, Edit, Trash2, MoreHorizontal, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AppEditModal } from './AppEditModal';
import { EnvEditModal } from './EnvEditModal';
import { toast } from 'sonner';

/** 状态标签变体映射 */
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
};

/** 状态标签映射 */
const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

interface AppListProps {
  onUpload: () => void;
}

export function AppList({ onUpload }: AppListProps) {
  const [apps, setApps] = useState<AppRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [editingApp, setEditingApp] = useState<AppRegistration | null>(null);
  const [envApp, setEnvApp] = useState<AppRegistration | null>(null);
  const [envData, setEnvData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    try {
      const response = await fetch('/api/apps');
      const result = await response.json();
      if (result.success) {
        setApps(result.data || []);
      }
    } catch {
      toast.error('加载APP列表失败');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Edit App (Open Modal)
  const handleEdit = (app: AppRegistration) => {
    setEditingApp(app);
  };

  // Handle Save App Info
  const saveAppInfo = async (id: string, data: Partial<AppRegistration>) => {
    try {
       toast.info('更新功能尚未对接后端API');
       setApps(apps.map(app => app.appId === id ? { ...app, ...data } : app));
    } catch (error) {
        throw error;
    }
  };

  // Handle Env (Open Modal)
  const handleEnv = async (app: AppRegistration) => {
    try {
        setEnvData({}); // Reset or set fetched data
        setEnvApp(app);
    } catch (error) {
        toast.error('获取环境变量失败');
    }
  };

  // Handle Save Env
  const saveEnv = async (data: Record<string, string>) => {
    if (!envApp) return;
    try {
        console.log('Saving env for', envApp.appId, data);
        toast.success(`环境变量已更新 (模拟)`);
    } catch (error) {
        throw error;
    }
  };

  // Handle Delete
  const handleDelete = async (appId: string) => {
    if (!confirm('确定要删除这个APP吗？此操作无法撤销。')) return;
    
    try {
        toast.info('删除功能尚未对接后端API');
        setApps(apps.filter(app => app.appId !== appId));
    } catch (error) {
        toast.error('删除失败');
    }
  };

  // Pagination Logic
  const totalItems = apps.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const currentApps = apps.slice(startIdx, startIdx + pageSize);

  if (isLoading) {
    return <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        ))}
    </div>;
  }

  // Remove early return for empty state to keep layout and pagination visible
  // if (apps.length === 0) { ... }


  return (
    <div className="flex flex-col h-full">
      {/* Table Container - Scrollable */}
      <div className={`flex-1 rounded-md border relative ${apps.length > 0 ? 'overflow-auto' : 'overflow-hidden'}`}>
        <table className="w-full caption-bottom text-sm h-full">
          <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-[80px] pl-6">图标</TableHead>
              <TableHead className="w-[200px]">APP 名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>APP ID</TableHead>
              <TableHead>版本</TableHead>
              <TableHead className="w-[300px]">描述</TableHead>
              <TableHead className="text-right pr-6">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentApps.length === 0 ? (
                <TableRow className="h-full">
                    <TableCell colSpan={7} className="text-center align-middle h-full">
                        <div className="flex flex-col items-center justify-center text-muted-foreground h-full min-h-[400px]">
                            <div className="bg-muted/50 p-4 rounded-full mb-4">
                                <Package size={48} />
                            </div>
                            <h3 className="text-lg font-semibold mb-1 text-foreground">暂无应用程序</h3>
                            <p className="max-w-xs mx-auto mb-6 text-sm">
                                您还没有创建任何应用程序。
                            </p>
                            <Button onClick={onUpload}>
                                上传 APP
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            ) : (
                currentApps.map((app, index) => (
              <TableRow key={app.appId} className="group border-b last:border-0 hover:bg-muted/30 transition-colors data-[state=selected]:bg-muted">
                <TableCell className="pl-6 py-4">
                    {/* Placeholder for App Icon */}
                    <div className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center text-white font-bold text-lg select-none ring-1 ring-black/5
                        ${['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500'][index % 5]}`}>
                        {app.appName.substring(0, 1).toUpperCase()}
                    </div>
                </TableCell>
                <TableCell className="font-medium text-base text-foreground">
                    {app.appName}
                </TableCell>
                <TableCell>
                    <Badge variant={STATUS_VARIANT[app.status] || 'secondary'} className="rounded-md px-2.5 py-0.5 font-normal shadow-none border-transparent bg-secondary/50 text-secondary-foreground hover:bg-secondary/60">
                        {STATUS_LABELS[app.status] || app.status}
                    </Badge>
                </TableCell>
                <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold text-muted-foreground">
                        {app.appId}
                    </code>
                </TableCell>
                <TableCell>
                    <span className="text-sm font-medium text-muted-foreground">v{app.latestVersion || '0.0.0'}</span>
                </TableCell>
                <TableCell className="max-w-[300px]">
                    <p className="truncate text-sm text-muted-foreground" title={app.description}>
                        {app.description || '暂无描述'}
                    </p>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(app)} title="编辑信息">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEnv(app)} title="环境变量">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(app.appId)} title="删除">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/5">
        <div className="text-sm text-muted-foreground">
           共 {totalItems} 条记录
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2 text-sm font-medium">
                {/* Simple Page Size Selector */}
                <span className="text-muted-foreground">每页行数</span>
                <select 
                    className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    {[10, 20, 30, 50].map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                第 {currentPage} / {totalPages || 1} 页
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                    <span className="sr-only">上一页</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                    <span className="sr-only">下一页</span>
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </Button>
            </div>
        </div>
      </div>

      {editingApp && (
        <AppEditModal
          isOpen={!!editingApp}
          onClose={() => setEditingApp(null)}
          app={editingApp}
          onSave={saveAppInfo}
        />
      )}

      {envApp && (
        <EnvEditModal
          isOpen={!!envApp}
          onClose={() => setEnvApp(null)}
          appId={envApp.appId}
          appName={envApp.appName}
          initialEnv={envData}
          onSave={saveEnv}
        />
      )}
    </div>
  );
}
