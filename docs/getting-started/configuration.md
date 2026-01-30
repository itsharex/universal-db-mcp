# 配置说明

本文档详细介绍 Universal DB MCP 的所有配置选项。

## 命令行参数

```bash
universal-db-mcp [选项]

选项：
  --type <db>              数据库类型（必需）
  --host <host>            数据库主机地址（默认: localhost）
  --port <port>            数据库端口
  --user <user>            用户名
  --password <password>    密码
  --database <database>    数据库名称
  --file <file>            SQLite 数据库文件路径
  --auth-source <db>       MongoDB 认证数据库（默认: admin）
  --danger-allow-write     启用写入模式（危险！）
  --help                   显示帮助信息
  --version                显示版本号
```

### 数据库类型参数

| 数据库 | --type 值 | 别名 |
|--------|-----------|------|
| MySQL | `mysql` | - |
| PostgreSQL | `postgres` | `postgresql` |
| Redis | `redis` | - |
| Oracle | `oracle` | - |
| SQL Server | `sqlserver` | `mssql` |
| MongoDB | `mongodb` | `mongo` |
| SQLite | `sqlite` | - |
| 达梦 | `dm` | `dameng` |
| KingbaseES | `kingbase` | - |
| GaussDB | `gaussdb` | `opengauss` |
| OceanBase | `oceanbase` | - |
| TiDB | `tidb` | - |
| ClickHouse | `clickhouse` | - |
| PolarDB | `polardb` | - |
| Vastbase | `vastbase` | - |
| HighGo | `highgo` | - |
| GoldenDB | `goldendb` | - |

## 环境变量

HTTP API 模式支持通过环境变量配置：

### 服务器配置

```bash
# 运行模式
MODE=http                    # mcp 或 http

# HTTP 服务器
HTTP_PORT=3000               # 监听端口
HTTP_HOST=0.0.0.0            # 监听地址
```

### 安全配置

```bash
# API 密钥（多个用逗号分隔）
API_KEYS=key1,key2,key3

# CORS 配置
CORS_ORIGINS=*               # 允许的来源
CORS_CREDENTIALS=false       # 是否允许凭证

# 速率限制
RATE_LIMIT_MAX=100           # 最大请求数
RATE_LIMIT_WINDOW=1m         # 时间窗口
```

### 数据库配置

```bash
# 默认数据库连接（可选）
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=mydb
```

### 会话配置

```bash
SESSION_TIMEOUT=3600000      # 会话超时（毫秒）
SESSION_CLEANUP_INTERVAL=300000  # 清理间隔
```

### 日志配置

```bash
LOG_LEVEL=info               # debug, info, warn, error
LOG_PRETTY=false             # 是否美化输出
```

## 配置文件

### .env 文件示例

```bash
# 服务器模式
MODE=http

# HTTP 配置
HTTP_PORT=3000
HTTP_HOST=0.0.0.0

# 安全配置
API_KEYS=your-secret-key-here
CORS_ORIGINS=https://your-domain.com
CORS_CREDENTIALS=false

# 速率限制
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1m

# 日志
LOG_LEVEL=info
LOG_PRETTY=false

# 会话
SESSION_TIMEOUT=3600000
SESSION_CLEANUP_INTERVAL=300000
```

### config/default.json

```json
{
  "server": {
    "mode": "mcp",
    "http": {
      "port": 3000,
      "host": "0.0.0.0"
    }
  },
  "security": {
    "rateLimit": {
      "max": 100,
      "window": "1m"
    }
  },
  "session": {
    "timeout": 3600000,
    "cleanupInterval": 300000
  }
}
```

## Claude Desktop 配置

### 配置文件位置

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 单数据库配置

```json
{
  "mcpServers": {
    "mysql-db": {
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

### 多数据库配置

```json
{
  "mcpServers": {
    "mysql-prod": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "mysql",
        "--host", "prod-db.example.com",
        "--port", "3306",
        "--user", "readonly",
        "--password", "prod_password",
        "--database", "production"
      ]
    },
    "postgres-analytics": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "postgres",
        "--host", "analytics.example.com",
        "--port", "5432",
        "--user", "analyst",
        "--password", "analytics_password",
        "--database", "warehouse"
      ]
    },
    "redis-cache": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "redis",
        "--host", "cache.example.com",
        "--port", "6379",
        "--password", "cache_password"
      ]
    }
  }
}
```

### 启用写入模式

```json
{
  "mcpServers": {
    "mysql-dev": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "mysql",
        "--host", "localhost",
        "--port", "3306",
        "--user", "dev_user",
        "--password", "dev_password",
        "--database", "dev_database",
        "--danger-allow-write"
      ]
    }
  }
}
```

## Cherry Studio 配置

Cherry Studio 也支持 MCP 协议，配置命令示例：

```bash
npx universal-db-mcp@latest --type mysql --host localhost --port 3306 --user root --password your_password --database your_database
```

## 配置优先级

配置加载优先级（从高到低）：

1. 命令行参数
2. 环境变量
3. .env 文件
4. config/default.json
5. 默认值

## 下一步

- [使用示例](./examples.md) - 各数据库使用示例
- [安全指南](../guides/security.md) - 安全最佳实践
- [部署指南](../deployment/README.md) - 生产环境部署
