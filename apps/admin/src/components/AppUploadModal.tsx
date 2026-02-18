'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileArchive } from 'lucide-react';
import { toast } from 'sonner';

interface AppUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AppUploadModal({ isOpen, onClose, onSuccess }: AppUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.zip')) {
        setFile(droppedFile);
      } else {
        toast.error('请上传 ZIP 格式的文件');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('请选择文件');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`APP ${result.data.appId} 发布成功`);
        onSuccess();
        onClose();
        setFile(null); // Reset
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('上传出错');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isUploading && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>上传 APP</DialogTitle>
          <DialogDescription>
            请上传包含 openone.config.json 的 ZIP 包
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div 
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer relative
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Input
              type="file"
              accept=".zip"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2 text-primary">
                <FileArchive className="h-8 w-8" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-primary' : ''}`} />
                <span className={`text-sm transition-colors ${isDragging ? 'text-primary font-medium' : ''}`}>
                    {isDragging ? '释放文件以添加' : '点击或拖拽 ZIP 文件至此'}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              '开始上传'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
