import type { ApiResponse } from '@openone/types';

/** HTTP请求配置 */
/** HTTP请求配置 */
interface Option extends RequestInit {
    /** 请求参数（拼接到URL） */
    params?: Record<string, string>;
}

/**
 * 创建带Token的HTTP请求客户端
 * @param host - API基础地址
 * @param findToken - 获取当前Token的函数
 * @returns 封装好的请求方法
 * @example
 * ```ts
 * const api = initClient('http://localhost:3002', () => token);
 * const result = await api.get('/api/apps');
 * ```
 */
export function initClient(
    host: string,
    findToken: () => string | null
) {
    /**
     * 发送HTTP请求
     * @param path - API路径
     * @param config - 请求配置
     * @returns 解析后的响应数据
     */
    async function request<T>(
        path: string,
        config: Option = {}
    ): Promise<ApiResponse<T>> {
        const { params, ...conf } = config;
        let url = `${host}${path}`;

        if (params) {
            const query = new URLSearchParams(params);
            url += `?${query.toString()}`;
        }

        const token = findToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(config.headers as Record<string, string>),
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...conf,
            headers,
        });

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                code: `HTTP_${response.status}`,
            };
        }

        return response.json();
    }

    return {
        get: <T>(path: string, params?: Record<string, string>) =>
            request<T>(path, { method: 'GET', params }),

        post: <T>(path: string, body?: unknown) =>
            request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

        put: <T>(path: string, body?: unknown) =>
            request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

        delete: <T>(path: string) =>
            request<T>(path, { method: 'DELETE' }),
    };
}
