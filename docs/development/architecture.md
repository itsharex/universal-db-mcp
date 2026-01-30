# 项目架构

本文档介绍 Universal DB MCP 的架构设计和核心模块。

## 双模式架构

项目支持两种运行模式，共享核心业务逻辑：

```
┌─────────────────────────────────────────────────────────────┐
│                      入口层 (index.ts)                       │
│                    根据 MODE 环境变量选择模式                  │
└──────────────────┬──────────────────────┬───────────────────┘
                   │                      │
         ┌─────────▼─────────┐  ┌────────▼──────────┐
         │   MCP 模式         │  │  HTTP API 模式     │
         │  (stdio 传输)      │  │  (REST API)       │
         └─────────┬─────────┘  └────────┬──────────┘
                   │                      │
         ┌─────────▼──────────────────────▼──────────────────┐
         │         核心业务逻辑层                              │
         │  ┌────────────────────────────────────┐           │
         │  │  DatabaseService                   │           │
         │  │  - executeQuery()                  │           │
         │  │  - getSchema()                     │           │
         │  │  - getTableInfo()                  │           │
         │  │  - validateQuery()                 │           │
         │  └────────────────────────────────────┘           │
         │  ┌────────────────────────────────────┐           │
         │  │  ConnectionManager                 │           │
         │  │  - connect()                       │           │
         │  │  - disconnect()                    │           │
         │  │  - 会话管理 (HTTP 模式)            │           │
         │  └────────────────────────────────────┘           │
         └──────────────────┬────────────────────────────────┘
                            │
         ┌──────────────────▼────────────────────────┐
         │           数据库适配器层                   │
         │  ┌──────────────────────────────────────┐ │
         │  │  DbAdapter 接口                       │ │
         │  │  - connect()                         │ │
         │  │  - disconnect()                      │ │
         │  │  - executeQuery()                    │ │
         │  │  - getSchema()                       │ │
         │  └──────────────────────────────────────┘ │
         │                                            │
         │  17 个数据库适配器实现                      │
         └────────────────────────────────────────────┘
```

## 目录结构

```
src/
├── index.ts                    # 入口文件，模式选择器
├── server.ts                   # 向后兼容导出
├── types/
│   ├── adapter.ts              # 数据库适配器类型定义
│   └── http.ts                 # HTTP API 类型定义
├── utils/
│   ├── safety.ts               # 查询安全验证
│   ├── adapter-factory.ts      # 适配器工厂
│   └── config-loader.ts        # 配置加载器
├── core/                       # 核心业务逻辑
│   ├── database-service.ts     # 数据库服务
│   └── connection-manager.ts   # 连接管理器
├── mcp/                        # MCP 模式
│   ├── mcp-server.ts           # MCP 服务器
│   └── mcp-index.ts            # MCP 入口
├── http/                       # HTTP API 模式
│   ├── server.ts               # Fastify 服务器
│   ├── http-index.ts           # HTTP 入口
│   ├── routes/                 # API 路由
│   └── middleware/             # 中间件
└── adapters/                   # 数据库适配器
    ├── mysql.ts
    ├── postgres.ts
    ├── redis.ts
    └── ...                     # 17 个适配器
```

## 核心模块

### DatabaseService

数据库服务层，封装核心业务逻辑：

```typescript
class DatabaseService {
  // 执行查询
  async executeQuery(query: string, params?: unknown[]): Promise<QueryResult>

  // 获取数据库结构
  async getSchema(): Promise<SchemaInfo>

  // 获取表信息
  async getTableInfo(tableName: string): Promise<TableInfo>

  // 验证查询安全性
  validateQuery(query: string): boolean
}
```

### ConnectionManager

连接管理器，处理数据库连接生命周期：

```typescript
class ConnectionManager {
  // 创建连接
  async connect(config: DbConfig): Promise<string>

  // 断开连接
  async disconnect(sessionId: string): Promise<void>

  // 获取连接
  getConnection(sessionId: string): DbAdapter | undefined

  // 清理过期会话
  cleanupExpiredSessions(): void
}
```

### AdapterFactory

适配器工厂，集中管理适配器创建：

```typescript
class AdapterFactory {
  // 创建适配器
  static createAdapter(type: string, config: DbConfig): DbAdapter

  // 验证配置
  static validateConfig(type: string, config: DbConfig): boolean

  // 获取支持的数据库类型
  static getSupportedTypes(): string[]
}
```

## 数据库适配器

### DbAdapter 接口

所有数据库适配器实现统一接口：

```typescript
interface DbAdapter {
  // 连接数据库
  connect(): Promise<void>

  // 断开连接
  disconnect(): Promise<void>

  // 执行查询
  executeQuery(query: string, params?: unknown[]): Promise<QueryResult>

  // 获取数据库结构
  getSchema(): Promise<SchemaInfo>

  // 获取表信息
  getTableInfo(tableName: string): Promise<TableInfo>

  // 检查是否为写操作
  isWriteOperation(query: string): boolean
}
```

### 适配器分类

| 类型 | 适配器 | 驱动 |
|------|--------|------|
| MySQL 兼容 | mysql, tidb, oceanbase, polardb, goldendb | mysql2 |
| PostgreSQL 兼容 | postgres, kingbase, gaussdb, vastbase, highgo | pg |
| 其他 | oracle, sqlserver, mongodb, redis, sqlite, clickhouse | 各自驱动 |

## 数据流

### MCP 模式

```
Claude Desktop → stdio → MCP Server → DatabaseService → Adapter → Database
```

### HTTP API 模式

```
HTTP Client → REST API → Middleware → Routes → DatabaseService → Adapter → Database
```

## 设计原则

1. **关注点分离** - MCP 和 HTTP 模式各自独立，共享核心逻辑
2. **适配器模式** - 统一的 DbAdapter 接口，支持 17 种数据库
3. **工厂模式** - AdapterFactory 集中管理适配器创建
4. **服务层** - DatabaseService 封装业务逻辑，被两种模式复用
5. **会话管理** - HTTP 模式支持多并发连接，MCP 模式单连接
6. **安全第一** - 默认只读模式，查询验证，API Key 认证

## 扩展指南

### 添加新数据库

1. 在 `src/adapters/` 创建新适配器
2. 实现 `DbAdapter` 接口
3. 在 `AdapterFactory` 中注册
4. 更新文档

详见 [添加新数据库](./adding-database.md)。

### 添加新 API 端点

1. 在 `src/http/routes/` 创建新路由
2. 在 `src/http/routes/index.ts` 注册
3. 更新 API 文档

### 添加新中间件

1. 在 `src/http/middleware/` 创建新中间件
2. 在 `src/http/middleware/index.ts` 注册
