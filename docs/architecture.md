# 架构设计文档（OpenOne 多应用平台）

## 1. 背景与目标

本仓库实现一个“多应用（App）独立开发 + 统一发布治理”的平台形态：

- 每个 App 可独立开发、独立本地运行、独立演进。
- 所有 App 共享同一个 Postgres 数据库连接（同一个 `DATABASE_URL`），但每个 App 使用独立的 Postgres Schema（`pgSchema`）实现数据隔离。
- 由 Admin App 提供上传、审核、发布能力；发布后将权限与数据库 Schema 元数据同步到平台的权限/数据库管理 App 中集中治理。

## 2. 设计原则

- 独立开发优先：App 本地开发应只依赖自身配置与脚本即可完成迁移与运行。
- “单库多 schema”：减少运维与连接管理成本，同时保留每个 App 的数据隔离边界。
- 内聚边界清晰：权限、数据库、会话等能力由独立应用/包负责，避免逻辑散落在各 App。
- 共享包命名短：packages 下导出函数优先 1 个单词、最长 2 个单词（示例：`db`、`schemaName`、`signer`）。
- 安全默认：发布、同步、注册均要求明确的鉴权/签名，避免跨应用的任意写入。

## 3. 仓库结构

- `apps/*`：业务应用与平台应用（Next.js App Router）。
  - `apps/login`：登录入口，签发会话 Cookie。
  - `apps/gateway`：网关/聚合入口，通过 Cookie 调用权限服务决定可访问的 App。
  - `apps/permission`：权限管理应用（权限码注册、启用/禁用、版本发布、用户权限集查询）。
  - `apps/database`：数据库 Schema 元数据管理应用（Schema、版本、发布态）。
  - `apps/admin`：发布治理应用（上传包、审核发布、同步到 permission/database）。
- `packages/*`：跨 App 复用包（仅包含轻量逻辑）。
  - `packages/types`：纯类型（接口）包，承载跨应用共享的数据结构（Result、PlatformError、UserContext 等）。
  - `packages/auth`：会话签名/读取与用户上下文转换。
  - `packages/database`：Drizzle(Postgres.js) 客户端创建、schema 命名、schema 初始化。
  - `packages/permission`：权限网关抽象（以 PermissionService 适配器驱动）。

## 4. 运行时组件与责任边界

### 4.1 Login App（登录）

- 责任：
  - 验证登录输入（当前示例为简单校验）。
  - 生成会话（`sessionId/tenantId/userId`）并写入 Cookie。
- 核心实现：
  - 使用 `@openone/authentication` 的 `signer` 生成 token。
  - Cookie 名称与密钥来自 `SESSION_COOKIE` / `SESSION_SECRET`。

### 4.2 Permission App（权限）

- 责任：
  - 管理应用标识与密钥（用于应用侧“注册权限清单”的签名）。
  - 接收应用注册的权限码清单并 Upsert。
  - 权限启用/禁用。
  - 发布权限版本（用于缓存失效）。
  - 提供“用户权限集查询”接口给 Gateway/业务 App。
- 鉴权模型：
  - 管理类接口：使用登录 Cookie（`readUser`）。
  - 注册权限清单：使用应用签名请求（HMAC + 时间窗 + nonce）。

### 4.3 Database App（Schema 元数据）

- 责任：
  - 保存每个应用的 Schema 元数据（名称、归属 applicationKey）。
  - 保存 Schema 版本（definition JSON、draft/published/archived 状态）。
  - 发布流程：将某一版本置为 published，同时归档旧 published。
- 说明：
  - Database App 管理的是“Schema 元数据与版本”，并不直接对目标 App 执行物理迁移；物理迁移由 App 本地 `drizzle-kit migrate` 完成（见第 6 节）。

### 4.4 Admin App（上传/审核/发布/同步）

- 责任（MVP）：
  - 接受 App 发布包上传（JSON 或附件形式）。
  - 审核发布：将包内权限与 schema 元数据同步到 Permission/Database App，并触发发布动作。
- 当前实现（MVP）：
  - 上传：将内容落盘到 `apps/admin/uploads/*.json`。
  - 发布：调用 Permission/Database App 的 API 执行同步与发布。
- 环境依赖：
  - `PERMISSION_URL`、`DATABASE_APP_URL` 指向对应服务地址。
  - 需要 Admin 自己具备登录 Cookie（复用 `SESSION_COOKIE/SESSION_SECRET`）。

## 5. 数据隔离：单库多 schema（pgSchema）

### 5.1 Schema 命名规则

目标：稳定、可预测、冲突概率低、长度安全（Postgres identifier ≤ 63）。

- 输入：`openone.appId`（App 标识） + `package.json name`
- 生成：`schemaName({ appId, packageName })`
- 格式：`app_<appId前12位>_<包名basename>`
  - 包名 basename：`@scope/name` → `name`

### 5.2 连接层实现（search_path）

所有使用 Drizzle(Postgres.js) 的 App 在创建连接时注入：

- `options = -c search_path=<appSchema>,public`

效果：

- 不显式指定 schema 的表/查询默认落在 App 自己的 schema 中。
- `public` 作为兜底（例如扩展、共享对象）。

### 5.3 本地 schema 初始化

每个具备数据库的 App 内置 `db:ensure`：

- 读取自身 `package.json` 的 `openone.appId` + `name`。
- 生成 schemaName。
- 执行 `create schema if not exists "<schema>"`。

## 6. 本地开发与迁移（每个 App 独立）

### 6.1 环境变量

所有 DB App（例如 permission/database）：

- `DATABASE_URL=postgres://.../openone`（同一个数据库）
- `SESSION_COOKIE`、`SESSION_SECRET`（鉴权用）

Admin App：

- `SESSION_COOKIE`、`SESSION_SECRET`
- `PERMISSION_URL`、`DATABASE_APP_URL`

### 6.2 迁移命令

具备数据库的 App 支持：

- `pnpm -C apps/<app> db:ensure`：确保 schema 存在
- `pnpm -C apps/<app> migrate`：先 ensure schema，再执行 `drizzle-kit migrate`

说明：

- 这保证“每个 App 单独拉代码 → 配好 `DATABASE_URL` → migrate → dev”即可工作。
- 不依赖根目录集中脚本（根 `scripts/` 已移除）。

## 7. 发布与同步（目标架构 + 当前实现）

本节描述“发布治理”的核心数据流，分为当前 MVP 与目标增强版。

### 7.1 发布包（Bundle）结构（MVP）

Admin 当前接收的 Bundle 为 JSON（或附件 JSON），关键字段：

- `applicationKey`：权限与 schema 元数据的归属（也是权限码前缀）。
- `name`：应用展示名。
- `permissions[]`：权限清单 `{code,name}`（code 会规范化为以 `applicationKey:` 开头）。
- `schema`：可选 `{ name, definition }`（definition 为 JSON object）。

### 7.2 同步权限（Admin → Permission App）

流程：

1. Admin 调用 `POST /api/application`（登录态）创建或读取应用密钥（返回 `secret`）。
2. Admin 使用 `secret` 对权限清单做 HMAC 签名，调用 `POST /api/permission/register` 注册/更新权限。
3. Admin 调用 `POST /api/permission/publish` 发布新版本。

安全点：

- `permission/register` 不依赖登录 Cookie；必须提供 `x-app-key/x-time/x-nonce/x-sign` 且时间窗有效。
- `application` 与 `publish` 依赖登录 Cookie（避免非管理员生成 secret 或发布版本）。

### 7.3 同步 Schema 元数据（Admin → Database App）

流程：

1. Admin 查 `GET /api/schema?applicationKey=...`，如果不存在目标 `name` 则创建 `POST /api/schema`。
2. Admin 创建版本 `POST /api/schema/version`（status=draft，definition=jsonb）。
3. Admin 发布版本 `POST /api/schema/publish`，并归档旧 published。

说明：

- 这一步只同步“Schema 元数据与版本”，用于治理、审核、回滚与可追溯。
- 物理数据库结构的变更仍由 App 自己的 `drizzle-kit migrate` 执行（见下节的目标增强）。

### 7.4 目标增强：同步“物理数据库”与 App 内管理

你提出的目标还包含：

- “Admin 发布审核并且同步 App 数据库（物理结构）”
- “App 发布后权限、数据库都同步到对应的 App 中管理”

推荐的增强设计（保持独立开发，同时实现集中发布）：

**方案 A（推荐）：发布迁移包（migrations as artifact）**

- App 在 CI 中生成迁移文件（drizzle migration）并打包进发布附件。
- Admin 在发布时把迁移包存储并下发给目标环境的 App。
- 目标 App 在启动或通过一个受保护的 API 执行：
  - `db:ensure`（确保 schema）
  - 应用迁移包（按版本顺序执行）
- Database App 记录“某环境/某 App 已应用到的版本号”，用于审计与回滚决策。

优点：

- App 完全掌控迁移生成与顺序，Admin 只负责分发与编排。
- 更贴近“独立开发”的边界。

**方案 B：Admin 直接对数据库执行迁移（集中执行）**

- Admin 使用统一数据库凭据，对目标 App 的 schema 执行迁移（需要 Admin 拥有 DB 写权限）。
- Admin 需要内置迁移执行器（或复用 drizzle-kit），并记录执行日志。

优点：

- 发布集中、动作一致。

缺点：

- Admin 侵入数据库执行面更深，权限更大，出错影响面更广。

**“同步到 App 内管理”的落地建议**

- 权限：Permission App 仍是“源”，App 只拉取并本地缓存（或同步到 App 自己的表用于离线/加速），由 App 自己的后台页面管理“角色与绑定”等本地业务规则。
- 数据库：Database App 仍是“元数据源”，App 本地只关心“实际迁移执行结果/当前版本”，由 Admin 编排推进版本。

## 8. 鉴权与安全

### 8.1 会话模型

- Token：`payload.base64url + "." + HMAC_SHA256(secret, payload)`
- Cookie：`SESSION_COOKIE`（默认 `openone_session`）
- 读取：各 App 的 `readUser()` 统一复用 `@openone/authentication` 的 `reader/context`

### 8.2 发布与同步安全

- Admin → Permission/Database 的管理动作使用登录态 Cookie。
- App → Permission 的权限注册使用应用签名（避免泄露管理员会话）。
- 推荐增强：
  - Admin 的发布接口引入角色校验（例如仅允许 tenant 管理员）。
  - 对上传包做更严格的 schema 校验（JSON Schema / zod）。
  - 对附件采用对象存储（S3 等）并带签名 URL，避免本地落盘。

## 9. 可观测性与运维建议（规划）

当前实现偏 MVP，建议在下一阶段补齐：

- 请求追踪：为每次发布生成 `requestId`，贯穿 Admin → Permission/Database 的调用链。
- 审计：在 Permission/Database 记录发布者、时间、变更摘要（可利用 `AuditRecord` 类型扩展实现）。
- 重试与幂等：
  - publish 接口与“创建 app / 创建 schema”应具备幂等语义（已对 Permission `/api/application` 做了 key 幂等）。
  - Admin 发布流程应记录 step 状态并支持重入。

## 10. 关键接口清单（现状）

### 10.1 Permission App

- `POST /api/application`：创建或读取应用 secret（登录态）
- `POST /api/permission/register`：应用签名注册权限清单
- `POST /api/permission/publish`：发布权限版本（登录态）
- `PATCH /api/permission/enable`：启用/禁用权限（登录态）
- `GET /api/permission-set?applicationKey=...`：查询用户权限集（登录态）

### 10.2 Database App

- `POST /api/schema`：创建 schema 元数据（登录态）
- `GET /api/schema`：列表/过滤（登录态）
- `POST /api/schema/version`：创建版本（登录态）
- `GET /api/schema/version`：版本列表（登录态）
- `POST /api/schema/publish`：发布版本（登录态）
- `GET /api/schema/current`：查询当前发布版本（登录态）

### 10.3 Admin App（MVP）

- `POST /api/app/upload`：上传发布包（JSON 或附件 JSON）
- `POST /api/app/publish`：审核发布并同步权限+schema 元数据（登录态）

## 11. 已知限制（MVP）

- Admin 当前将上传内容落盘到本地 `uploads/`，不适合多实例部署与生产使用。
- Admin 发布流程目前是顺序调用外部 API，缺少队列、幂等键、失败补偿与审计日志。
- Database App 当前只管理 schema 元数据，不负责对目标 App schema 执行物理迁移（建议按第 7.4 的增强方案落地）。

## 12. 下一步实施建议（按优先级）

1. 定义“发布包”标准：manifest、permissions、schema、migrations（zip）。
2. Admin 引入持久化（DB）保存包、审核状态、发布记录、执行日志、幂等键。
3. 引入“迁移执行”方案（推荐方案 A：迁移包下发 + App 执行）。
4. 为 Permission/Database 增加审计与幂等（例如 schema create、version create 的幂等键）。
5. 对外暴露的同步 API 增加更细粒度的权限控制与速率限制。
