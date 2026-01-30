# KingbaseES 使用指南

## 配置示例

### Claude Desktop 配置

```json
{
  "mcpServers": {
    "kingbase-db": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "kingbase",
        "--host", "localhost",
        "--port", "54321",
        "--user", "system",
        "--password", "your_password",
        "--database", "test"
      ]
    }
  }
}
```

### 连接远程 KingbaseES

```json
{
  "mcpServers": {
    "kingbase-prod": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "kingbase",
        "--host", "kingbase.example.com",
        "--port", "54321",
        "--user", "readonly_user",
        "--password", "secure_password",
        "--database", "production"
      ]
    }
  }
}
```

## 连接参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--host` | 数据库主机地址 | localhost |
| `--port` | 数据库端口 | 54321 |
| `--user` | 用户名 | - |
| `--password` | 密码 | - |
| `--database` | 数据库名 | - |

## 使用示例

### 查看表结构

```
用户: 查看数据库中有哪些表

Claude 会自动:
1. 调用 get_schema 工具
2. 查询 public schema 下的所有表
3. 返回表列表
```

### 执行查询

```
用户: 统计每个部门的员工数量

Claude 会自动:
1. 生成 SQL: SELECT department_id, COUNT(*) as count FROM employees GROUP BY department_id
2. 执行并返回结果
```

## 兼容性

KingbaseES 基于 PostgreSQL 开发，兼容 PostgreSQL 协议和 SQL 语法。

## 支持的版本

- KingbaseES V8
- KingbaseES V9

## 常见使用场景

### 国产化数据库迁移

从 PostgreSQL 迁移到 KingbaseES：

```
用户: 帮我分析现有表结构，准备迁移到 KingbaseES

Claude 会:
1. 获取完整的 Schema 信息
2. 分析表结构、索引、约束
3. 提供迁移建议
```

## 注意事项

1. **默认端口** - 54321（与 PostgreSQL 不同）
2. **Schema** - 默认查询 public schema
3. **参数化查询** - 支持 $1, $2, ... 占位符
4. **驱动** - 使用 PostgreSQL 的 pg 驱动
5. **国产化** - 适用于国产化替代场景
