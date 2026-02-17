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

export function AppList() {
  const [apps, setApps] = useState<AppRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
        // TODO: Implement update API
        // For now, assume success and update local state
        // In real impl, fetch PUT /api/apps/{id}
        
        // Mock update for now or implement API
        /*
        await fetch(`/api/apps/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        */
       toast.info('更新功能尚未对接后端API');
       
       setApps(apps.map(app => app.appId === id ? { ...app, ...data } : app));
    } catch (error) {
        throw error;
    }
  };

  // Handle Env (Open Modal)
  const handleEnv = async (app: AppRegistration) => {
    try {
        // Fetch current env
        // TODO: Need an endpoint to get ENV. 
        // For now mocking or assuming empty.
        // const res = await fetch(`/api/apps/${app.appId}/env`);
        
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
        // TODO: Call API to save .env
        // await fetch(`/api/apps/${envApp.appId}/env`, { method: 'POST', body: JSON.stringify(data) });
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
        // await fetch(`/api/apps/${appId}`, { method: 'DELETE' });
        toast.info('删除功能尚未对接后端API');
        setApps(apps.filter(app => app.appId !== appId));
    } catch (error) {
        toast.error('删除失败');
    }
  };

  if (isLoading) {
    return <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>;
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-20 border rounded-lg bg-muted/10">
        <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">暂无APP，点击上方按钮上传</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>APP名称</TableHead>
              <TableHead>APP ID</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.appId}>
                <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{app.appName}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{app.description}</span>
                    </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{app.appId}</TableCell>
                <TableCell>
                    <Badge variant="outline">v{app.latestVersion || '0.0.0'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[app.status] || 'secondary'}>
                    {STATUS_LABELS[app.status] || app.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(app)} title="编辑信息">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEnv(app)} title="环境变量">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(app.appId)} title="删除" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
    </>
  );
}
