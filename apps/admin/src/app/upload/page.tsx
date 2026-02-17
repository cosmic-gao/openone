'use client';

import { useState, useRef } from 'react';
import { Upload, FileArchive, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

/**
 * APP上传页面
 * 支持拖拽和点击上传ZIP包
 */
export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择
   */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  }

  /**
   * 处理拖拽
   */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.zip')) {
      setFile(dropped);
      setResult(null);
    } else {
      setResult({ success: false, message: '请上传 .zip 格式的文件' });
    }
  }

  /**
   * 提交上传
   */
  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: `APP 上传成功！ID: ${data.data.appId}, 版本: ${data.data.version}` });
        setFile(null);
      } else {
        setResult({ success: false, message: data.error || '上传失败' });
      }
    } catch {
      setResult({ success: false, message: '网络错误，请稍后重试' });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>上传 APP</CardTitle>
          <CardDescription>
            上传包含 openone.config.json 的 ZIP 包，系统将自动解析、注册并分发环境变量
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 拖拽区域 */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
              transition-colors duration-200
              ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            `}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileArchive size={40} className="text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={40} className="text-muted-foreground" />
                <div>
                  <p className="font-medium">拖拽 ZIP 文件到此处</p>
                  <p className="text-sm text-muted-foreground">或点击选择文件</p>
                </div>
              </div>
            )}
          </div>

          {/* 上传按钮 */}
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? '上传中...' : '开始上传'}
          </Button>

          {/* 结果提示 */}
          {result && (
            <div
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${
                result.success
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {result.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
