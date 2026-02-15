# OpenOne - 多APP管理平台

基于微前端架构的"APP工厂"平台，用户可使用 Next.js + Shadcn + TailwindCSS +
Drizzle 快速构建业务APP，以 ZIP 包形式上传发布。

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                  用户浏览器                        │
│    ┌──────────┐     ┌──────────────────────────┐ │
│    │ auth-app │────▶│       shell-app          │ │
│    │ :3001    │     │ :3000 (Wujie主框架)       │ │
│    └──────────┘     │  ┌──────┐ ┌──────┐       │ │
│                     │  │子APP │ │子APP │ ...    │ │
│                     │  └──────┘ └──────┘       │ │
│                     └──────────────────────────┘ │
└──────────┬──────────────────┬───────────────┬────┘
           │                  │               │
    ┌──────▼──────┐  ┌───────▼──────┐ ┌──────▼──────┐
    │ admin-app   │  │permission-app│ │db-manager-app│
    │ :3002       │  │ :3003        │ │ :3004        │
    └─────────────┘  └──────────────┘ └──────────────┘
                          │                │
                     ┌────▼────────────────▼────┐
                     │    PostgreSQL :5432       │
                     │  ┌─────────┐ ┌─────────┐ │
                     │  │platform │ │001_xxx  │ │
                     │  │ schema  │ │ schema  │ │
                     │  └─────────┘ └─────────┘ │
                     └──────────────────────────┘
```

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动数据库
docker-compose up -d

# 3. 复制环境变量
cp .env.example .env

# 4. 启动所有APP（Turbo并行）
pnpm dev
```

启动后：

- **Shell** (入口): http://localhost:3000
- **登录**: http://localhost:3001 (账号: admin / admin123)
- **APP管理**: http://localhost:3002
- **权限管理**: http://localhost:3003
- **数据库管理**: http://localhost:3004

## 核心APP

| APP        | 端口 | 职责                        |
| ---------- | ---- | --------------------------- |
| auth       | 3001 | 用户认证、JWT签发           |
| shell      | 3000 | Wujie微前端主框架、菜单聚合 |
| admin      | 3002 | APP上传、发布、版本管理     |
| permission | 3003 | 权限定义、角色、授权        |
| database   | 3004 | PG Schema管理、迁移执行     |

## 共享包

| 包             | 说明                           |
| -------------- | ------------------------------ |
| @openone/types | 全平台TypeScript类型定义       |
| @openone/utils | JWT、HTTP客户端、日志工具      |
| @openone/db    | PostgreSQL连接工厂、Schema管理 |

## 用户APP开发

1. 复制 `templates/app-template/` 作为起点
2. 修改 `openone.config.json` 配置APP信息、菜单、权限和数据库
3. 开发完成后打ZIP包上传到admin-app

## 技术栈

Next.js 15 · React 19 · TailwindCSS 4 · Drizzle ORM · PostgreSQL 16 ·
Wujie微前端 · Zustand · Turbo · pnpm
