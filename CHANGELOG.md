# 更新日志

本文档记录 Universal DB MCP 的版本更新历史。

## [2.3.8] - 2024

### 修复
- Oracle、达梦执行 SQL 去掉分号

## [2.3.7] - 2024

### 修复
- 达梦 get_schema 问题修复

## [2.3.6] - 2024

### 修复
- 达梦 get_schema 问题修复

## [2.3.5] - 2024

### 修复
- 达梦 get_schema 问题修复

## [2.3.4] - 2024

### 修复
- 达梦 get_schema 问题修复

## [2.3.3] - 2024

### 修复
- 达梦 get_schema 问题，达梦不使用批量查询优化功能

## [2.3.2] - 2024

### 修复
- 达梦 get_schema 返回 table 为空问题处理

## [2.3.1] - 2024

### 修复
- 达梦适配器修复列名规范化、空值检查、类型安全

## [2.3.0] - 2024

### 性能优化
- 为 Oracle、达梦增加批量查询优化功能

## [2.2.0] - 2024

### 性能优化
- 批量查询优化，大幅提升 Schema 获取性能
- 支持的数据库：MySQL、PostgreSQL、SQL Server、Oracle、达梦等 13 个适配器

### 性能提升
| 表数量 | 优化前 | 优化后 | 提升 |
|--------|--------|--------|------|
| 50 张表 | ~5 秒 | ~200 毫秒 | 25x |
| 100 张表 | ~10 秒 | ~300 毫秒 | 33x |
| 500 张表 | ~50 秒 | ~500 毫秒 | 100x |

## [2.1.0] - 2024

### 新增
- Schema 缓存机制
- 缓存 TTL 配置
- 强制刷新功能
- 缓存统计信息

## [2.0.0] - 2024

### 新增
- HTTP API 模式
- 双模式架构（MCP + HTTP）
- API Key 认证
- 速率限制
- CORS 配置
- Docker 部署支持
- Serverless 部署配置（阿里云、腾讯云、AWS、Vercel）
- PaaS 部署配置（Railway、Render、Fly.io）

### 文档
- HTTP API 参考文档
- 部署指南
- 集成指南（Coze、n8n、Dify）

## [1.0.0] - 2024

### 新增
- 支持 17 种数据库
  - MySQL、PostgreSQL、Redis、Oracle、SQL Server
  - MongoDB、SQLite、达梦、KingbaseES、GaussDB
  - OceanBase、TiDB、ClickHouse、PolarDB
  - Vastbase、HighGo、GoldenDB
- MCP 协议支持
- 只读安全模式
- Claude Desktop 集成

---

## 版本号说明

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正
