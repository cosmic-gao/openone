'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface EnvVar {
  key: string;
  value: string;
  isSystem?: boolean; // 标记是否为系统生成的变量（只读）
}

interface EnvEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  appName: string;
  initialEnv?: Record<string, string>;
  onSave: (env: Record<string, string>) => Promise<void>;
}

const SYSTEM_PREFIXES = [
  'PORT',
  'NEXT_PUBLIC_APP_URL',
  'ADMIN_APP_URL',
  'DATABASE_URL',
  'SCHEMA_NAME',
  'PERMISSION_APP_URL',
  'DB_MANAGER_APP_URL',
];

export function EnvEditModal({
  isOpen,
  onClose,
  appId,
  appName,
  initialEnv = {},
  onSave,
}: EnvEditModalProps) {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 解析初始环境变量
      const parsedVars: EnvVar[] = Object.entries(initialEnv).map(([key, value]) => ({
        key,
        value,
        isSystem: SYSTEM_PREFIXES.includes(key) || key.startsWith('NEXT_PUBLIC_') || key.endsWith('_URL'),
      }));
      
      // 排序：自定义在前，系统在后
      parsedVars.sort((a, b) => {
        if (a.isSystem === b.isSystem) return a.key.localeCompare(b.key);
        return a.isSystem ? 1 : -1;
      });
      
      setVars(parsedVars);
    }
  }, [isOpen, initialEnv]);

  const handleAdd = () => {
    setVars([...vars, { key: '', value: '', isSystem: false }]);
  };

  const handleChange = (index: number, field: 'key' | 'value', value: string) => {
    setVars((prev) => {
      const newVars = [...prev];
      if (newVars[index]) {
        newVars[index] = { ...newVars[index], [field]: value };
      }
      return newVars;
    });
  };

  const handleDelete = (index: number) => {
    const newVars = [...vars];
    newVars.splice(index, 1);
    setVars(newVars);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const envRecord: Record<string, string> = {};
      
      // 简单的验证
      for (const v of vars) {
        if (!v.key.trim()) continue;
        if (envRecord[v.key]) {
          toast.error(`重复的变量名: ${v.key}`);
          setIsSaving(false);
          return;
        }
        envRecord[v.key] = v.value;
      }

      await onSave(envRecord);
      onClose();
    } catch (error) {
      console.error('Failed to save env', error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>环境变量配置 - {appName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          <div className="flex justify-between items-center">
            <Label>变量列表</Label>
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" /> 添加变量
            </Button>
          </div>

          <ScrollArea className="flex-1 border rounded-md p-4">
            <div className="space-y-4">
              {vars.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  暂无环境变量
                </div>
              )}
              {vars.map((v, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="变量名 (KEY)"
                      value={v.key}
                      onChange={(e) => handleChange(index, 'key', e.target.value)}
                      disabled={v.isSystem}
                      className={v.isSystem ? "bg-muted font-mono text-xs" : "font-mono"}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="变量值 (VALUE)"
                      value={v.value}
                      onChange={(e) => handleChange(index, 'value', e.target.value)}
                      disabled={v.isSystem}
                      className={v.isSystem ? "bg-muted font-mono text-xs" : "font-mono"}
                    />
                  </div>
                  {!v.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  {v.isSystem && (
                     <div className="w-10 flex justify-center items-center h-10">
                        <span className="text-xs text-muted-foreground">系统</span>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存配置
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
