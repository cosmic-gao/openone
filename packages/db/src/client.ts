import { drizzle } from 'drizzle-orm/postgres-js';
import { pgSchema } from 'drizzle-orm/pg-core';
import postgres from 'postgres';

/** 数据库连接缓存（按connectionUrl缓存） */
const connectionPool = new Map<string, ReturnType<typeof postgres>>();

/** Drizzle实例缓存（按cacheKey缓存） */
const drizzlePool = new Map<string, ReturnType<typeof drizzle>>();

/** pgSchema实例缓存（按schemaName缓存） */
const pgSchemaPool = new Map<string, ReturnType<typeof pgSchema>>();

/**
 * 获取原始Postgres连接
 * @param connectionUrl - 数据库连接URL
 * @returns postgres连接实例
 */
function getConnection(connectionUrl: string) {
    let connection = connectionPool.get(connectionUrl);
    if (!connection) {
        connection = postgres(connectionUrl);
        connectionPool.set(connectionUrl, connection);
    }
    return connection;
}

/**
 * 创建APP专属的Drizzle pgSchema实例
 * 使用 pgSchema 定义的表在查询时自动附加 "schema_name"."table_name" 前缀
 * @param schemaName - PG Schema名称
 * @returns pgSchema实例，可用于定义table/enum
 * @example
 * ```ts
 * const authSchema = createAppSchema('auth');
 * const users = authSchema.table('users', {
 *     id: uuid('id').primaryKey().defaultRandom(),
 *     username: text('username').notNull(),
 * });
 * ```
 */
export function createAppSchema(schemaName: string) {
    let schema = pgSchemaPool.get(schemaName);
    if (!schema) {
        schema = pgSchema(schemaName);
        pgSchemaPool.set(schemaName, schema);
    }
    return schema;
}

/**
 * 创建Drizzle ORM客户端
 * 使用pgSchema定义的表查询时自动带schema前缀，无需设置search_path
 * @param connectionUrl - 数据库连接URL
 * @param cacheKey - 可选的缓存标识，默认使用connectionUrl
 * @returns Drizzle ORM实例
 * @example
 * ```ts
 * const db = createClient(process.env.DATABASE_URL);
 * const result = await db.select().from(users); // 自动查询 "auth"."users"
 * ```
 */
export function createClient(connectionUrl: string, cacheKey?: string) {
    const key = cacheKey || connectionUrl;
    let client = drizzlePool.get(key);
    if (!client) {
        const sql = getConnection(connectionUrl);
        client = drizzle(sql);
        drizzlePool.set(key, client);
    }
    return client;
}

/**
 * 通过原始SQL在指定Schema下执行语句
 * @param connectionUrl - 数据库连接URL
 * @param schemaName - 目标Schema名称
 * @param sqlText - SQL语句
 * @returns 执行结果
 */
export async function executeInSchema(
    connectionUrl: string,
    schemaName: string,
    sqlText: string
) {
    const sql = getConnection(connectionUrl);
    await sql`SET search_path TO ${sql(schemaName)}`;
    return sql.unsafe(sqlText);
}

/**
 * 创建新的PG Schema
 * @param connectionUrl - 数据库连接URL
 * @param schemaName - 要创建的Schema名称
 */
export async function createSchema(
    connectionUrl: string,
    schemaName: string
) {
    const sql = getConnection(connectionUrl);
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
}

/**
 * 删除PG Schema
 * @param connectionUrl - 数据库连接URL
 * @param schemaName - 要删除的Schema名称
 * @param cascade - 是否级联删除Schema下所有对象
 */
export async function dropSchema(
    connectionUrl: string,
    schemaName: string,
    cascade = false
) {
    const sql = getConnection(connectionUrl);
    const cascadeClause = cascade ? 'CASCADE' : 'RESTRICT';
    await sql.unsafe(
        `DROP SCHEMA IF EXISTS "${schemaName}" ${cascadeClause}`
    );
}

/**
 * 获取数据库中所有Schema列表
 * @param connectionUrl - 数据库连接URL
 * @returns Schema名称列表
 */
export async function listSchemas(
    connectionUrl: string
): Promise<string[]> {
    const sql = getConnection(connectionUrl);
    const result = await sql`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name
  `;
    return result.map((row) => row.schema_name as string);
}

/**
 * 关闭所有数据库连接（用于优雅退出）
 */
export async function closeAllConnections() {
    for (const [key, connection] of connectionPool) {
        await connection.end();
        connectionPool.delete(key);
    }
    drizzlePool.clear();
    pgSchemaPool.clear();
}
