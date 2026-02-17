import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 数据库管理首页
 * 展示所有Schema的概览
 */
export default function DbManagerPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database size={24} className="text-primary" />
        <h1 className="text-xl font-semibold">数据库管理</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard title="活跃Schema" count={0} description="当前运行中的APP Schema" />
        <DashboardCard title="迁移记录" count={0} description="累计执行的迁移次数" />
      </div>

      <div className="mt-6">
        <h2 className="text-base font-medium mb-3">Schema 列表</h2>
        <Card className="py-8">
          <CardContent className="text-center">
            <Database size={36} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              暂无Schema，上传APP后会自动创建
            </p>
          </CardContent>
        </Card>
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
