import { NextRequest, NextResponse } from 'next/server';
import { appRunner } from '@/services/app-runner';
import { makeLogger } from '@openone/utils';

const logger = makeLogger('api-app-control');

interface RouteContext {
    params: Promise<{ appId: string }>;
}

/**
 * POST /api/apps/[appId]/control
 * 控制APP启停
 * Body: { action: 'start' | 'stop', version?: string }
 */
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    const { appId } = await context.params;

    try {
        const body = await request.json();
        const { action, version } = body;

        logger.logInfo(`收到APP控制请求`, { appId, action, version });

        if (action === 'start') {
            if (!version) {
                return NextResponse.json(
                    { success: false, error: '启动需指定版本号' },
                    { status: 400 }
                );
            }
            const success = await appRunner.start(appId, version);
            if (success) {
                return NextResponse.json({ success: true, message: '应用启动成功' });
            } else {
                return NextResponse.json({ success: false, error: '应用启动失败' }, { status: 500 });
            }
        }

        if (action === 'stop') {
            const success = await appRunner.stop(appId);
            if (success) {
                return NextResponse.json({ success: true, message: '应用已停止' });
            } else {
                return NextResponse.json({ success: false, error: '应用停止失败或未运行' }, { status: 500 });
            }
        }

        return NextResponse.json(
            { success: false, error: '无效的操作' },
            { status: 400 }
        );

    } catch (error) {
        logger.logError('APP控制请求处理异常', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/apps/[appId]/control
 * 获取APP运行状态
 */
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    const { appId } = await context.params;
    const status = appRunner.getStatus(appId);
    return NextResponse.json({ success: true, data: status });
}
