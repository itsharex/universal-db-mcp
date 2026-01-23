# 🔌 MCP 数据库万能连接器

> 让 Claude Desktop 直接连接你的数据库，用自然语言查询和分析数据

[![npm version](https://img.shields.io/npm/v/universal-db-mcp.svg)](https://www.npmjs.com/package/universal-db-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 为什么使用本项目

作为开发者，你是否遇到过这些场景：

- 📊 **临时数据分析**：想快速查看生产数据库的某些指标，但不想写 SQL？
- 🔍 **问题排查**：需要跨多个表关联查询，但记不清表结构？
- 🤖 **AI 辅助开发**：希望 Claude 能直接理解你的数据库结构，生成准确的查询？

**MCP 数据库万能连接器** 通过 Model Context Protocol (MCP) 协议，让 Claude Desktop 成为你的数据库助手：

✅ **自然语言查询** - 用中文描述需求，Claude 自动生成并执行 SQL

✅ **智能表结构理解** - 自动获取数据库 Schema，提供精准建议

✅ **多数据库支持** - MySQL、PostgreSQL、Redis、Oracle、达梦 一键切换

✅ **安全第一** - 默认只读模式，防止误操作删库

✅ **开箱即用** - 无需复杂配置，一行命令启动



## 🚀 快速开始

### 前置要求

- Node.js >= 20
- Claude Desktop 应用
- 至少一个数据库实例（MySQL/PostgreSQL/Redis/Oracle/达梦）

### 安装

```bash
npm install -g universal-db-mcp
```

或使用 npx 直接运行（无需安装）：

```bash
npx universal-db-mcp
```

### 配置 Claude Desktop

编辑 Claude Desktop 配置文件：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

添加以下配置：

```json
{
  "mcpServers": {
    "universal-db": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "mysql",
        "--host", "localhost",
        "--port", "3306",
        "--user", "root",
        "--password", "your_password",
        "--database", "your_database"
      ]
    }
  }
}
```

### 启动使用

1. 重启 Claude Desktop
2. 在对话中直接询问：
   - "帮我查看 users 表的结构"
   - "统计最近 7 天的订单数量"
   - "找出消费金额最高的 10 个用户"

Claude 会自动调用数据库工具完成查询！

## 🛡️ 安全模式

**默认情况下，本工具运行在只读模式**，会拒绝所有写入操作（DELETE、UPDATE、DROP、TRUNCATE）。

如果你需要执行写入操作（请谨慎！），需要显式添加参数：

```json
{
  "args": [
    "universal-db-mcp",
    "--danger-allow-write",
    "--type", "mysql",
    ...
  ]
}
```

⚠️ **警告**：启用写入模式后，Claude 可以修改你的数据库。请仅在开发环境使用，或确保你完全理解操作的后果。

## 📖 支持的数据库

| 数据库 | 类型参数 | 默认端口 | 状态 | 说明 |
|--------|---------|---------|------|------|
| MySQL | `--type mysql` | 3306 | ✅ 已支持 | - |
| PostgreSQL | `--type postgres` | 5432 | ✅ 已支持 | - |
| Redis | `--type redis` | 6379 | ✅ 已支持 | - |
| Oracle（12c以上） | `--type oracle` | 1521 | ✅ 已支持 | - |
| 达梦（DM7/DM8） | `--type dm` | 5236 | ✅ 已支持 | 驱动自动安装 |
| MongoDB | `--type mongo` | - | 🚧 计划中 | - |
| SQLite | `--type sqlite` | - | 🚧 计划中 | - |

**注意**: 达梦数据库驱动 `dmdb` 会作为可选依赖自动安装。如果安装失败，请手动运行 `npm install -g dmdb`。

## 🔧 命令行参数

```bash
universal-db-mcp [选项]

选项：
  --type <db>              数据库类型 (mysql|postgres|redis|oracle|dm)
  --host <host>            数据库主机地址 (默认: localhost)
  --port <port>            数据库端口
  --user <user>            用户名
  --password <password>    密码
  --database <database>    数据库名称
  --danger-allow-write     启用写入模式（危险！）
  --help                   显示帮助信息
```

## 🏗️ 架构设计

本项目采用模块化适配器模式，方便社区贡献新的数据库支持：

```
src/
├── adapters/          # 数据库适配器
│   ├── mysql.ts
│   ├── postgres.ts
│   ├── redis.ts
│   ├── oracle.ts
│   └── dm.ts
├── types/             # TypeScript 类型定义
│   └── adapter.ts
├── utils/             # 工具函数
│   └── safety.ts      # 安全检查逻辑
└── server.ts          # MCP 服务器主逻辑
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

如果你想添加新的数据库支持，只需：

1. 在 `src/adapters/` 下实现 `DbAdapter` 接口
2. 添加对应的数据库驱动依赖
3. 更新 README 文档

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 开源协议

MIT License - 自由使用，欢迎 Star ⭐

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - Anthropic 提供的强大协议
- 所有贡献者和使用者

---

**如果这个项目对你有帮助，请给个 Star ⭐ 支持一下！**
