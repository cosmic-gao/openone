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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AppRegistration } from '@openone/types';

interface AppEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppRegistration;
  onSave: (id: string, data: Partial<AppRegistration>) => Promise<void>;
}

export function AppEditModal({
  isOpen,
  onClose,
  app,
  onSave,
}: AppEditModalProps) {
  const [name, setName] = useState(app.appName);
  const [description, setDescription] = useState(app.description || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(app.appName);
      setDescription(app.description || '');
    }
  }, [isOpen, app]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(app.appId, { appName: name, description });
      onClose();
    } catch (error) {
      console.error('Failed to update app', error);
      toast.error('更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑 APP 信息</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              名称
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              描述
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
