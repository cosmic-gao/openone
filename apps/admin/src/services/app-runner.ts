import pm2, { ProcessDescription } from 'pm2';
import path from 'path';
import fs from 'fs/promises';
import { makeLogger } from '@openone/utils';

const logger = makeLogger('app-runner');

class AppRunnerService {
    private storagePath: string;

    constructor() {
        this.storagePath = process.env.APP_STORAGE_PATH || './storage/apps';
    }

    private connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            pm2.connect((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * 启动指定APP
     */
    async start(appId: string, version: string): Promise<boolean> {
        try {
            await this.connect();

            const appDir = path.resolve(this.storagePath, appId, version);
            const envPath = path.join(appDir, '.env');

            // 读取 .env 获取端口
            const envContent = await fs.readFile(envPath, 'utf-8');
            const portMatch = envContent.match(/PORT=(\d+)/);
            const port = portMatch ? portMatch[1] : '3000';

            // 检查是否已经在运行
            const list = await new Promise<ProcessDescription[]>((resolve, reject) => {
                pm2.list((err, list) => err ? reject(err) : resolve(list));
            });

            const isRunning = list.some(p => p.name === appId);
            if (isRunning) {
                logger.logInfo(`APP ${appId} 已经在运行中`);
                return true;
            }

            logger.logInfo(`启动 APP: ${appId} v${version} on port ${port} using PM2`);

            return new Promise((resolve) => {
                pm2.start({
                    name: appId,
                    script: 'npm',
                    args: ['start'], // Start script
                    cwd: appDir,
                    env: {
                        ...process.env as Record<string, string>,
                        PORT: String(port),
                        NODE_ENV: 'production'
                    },
                    autorestart: true,
                    max_restarts: 10,
                }, (err) => {
                    if (err) {
                        logger.logError(`启动 APP ${appId} 失败`, err);
                        resolve(false);
                    } else {
                        logger.logInfo(`APP ${appId} 启动成功`);
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            logger.logError(`APP Runner 异常`, error);
            return false;
        }
    }

    /**
     * 停止指定APP
     */
    async stop(appId: string): Promise<boolean> {
        try {
            await this.connect();
            return new Promise((resolve) => {
                pm2.stop(appId, (err) => {
                    if (err) {
                        // 如果进程不存在，也算停止成功，或者是未运行
                        // pm2 报错 process not found 时，尝试 delete
                        pm2.delete(appId, (delErr) => {
                            if (delErr) {
                                logger.logError(`停止 APP ${appId} 失败`, err);
                                resolve(false);
                            } else {
                                resolve(true);
                            }
                        });
                    } else {
                        // 停止后从列表中删除，以便下次能以新配置启动
                        pm2.delete(appId, () => {
                            logger.logInfo(`APP ${appId} 已停止`);
                            resolve(true);
                        });
                    }
                });
            });
        } catch (error) {
            logger.logError(`APP ${appId} 停止异常`, error);
            return false;
        }
    }

    /**
     * 获取APP运行状态
     */
    async getStatus(appId: string) {
        try {
            await this.connect();
            const list = await new Promise<ProcessDescription[]>((resolve, reject) => {
                pm2.describe(appId, (err, list) => err ? reject(err) : resolve(list));
            });

            if (list && list.length > 0) {
                const proc = list[0];
                if (!proc) return { status: 'stopped' };

                // pm2 状态: online, stopping, stopped, launching, errored, one-launch-status
                const status = proc.pm2_env?.status === 'online' ? 'running' : 'stopped';
                // 尝试从 pm2_env 中获取端口
                const port = proc.pm2_env?.env?.PORT ? parseInt(proc.pm2_env.env.PORT) : 0;

                return {
                    status,
                    pid: proc.pid,
                    port,
                    startTime: proc.pm2_env?.pm_uptime,
                    version: 'latest' // PM2 doesn't store version easily unless we put it in env, TODO
                };
            }
            return { status: 'stopped' };
        } catch {
            return { status: 'stopped' };
        }
    }
}

// 单例模式
export const appRunner = new AppRunnerService();
