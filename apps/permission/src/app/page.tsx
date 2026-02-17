import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 权限管理首页
 */
export default function PermissionPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-primary" />
        <h1 className="text-xl font-semibold">权限管理</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="权限定义" count={0} description="所有APP注册的权限总数" />
        <DashboardCard title="角色" count={0} description="已创建的角色总数" />
        <DashboardCard title="用户" count={0} description="已授权的用户总数" />
      </div>
    </div>
  );
}

/** 仪表盘统计卡片 */
function DashboardCard({
  title,
  count,
  description,
}: {
  title: string;
  count: number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold mb-1">{count}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
