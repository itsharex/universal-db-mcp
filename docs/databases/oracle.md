# Oracle 使用指南

## 配置示例

### Claude Desktop 配置

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "oracle",
        "--host", "localhost",
        "--port", "1521",
        "--user", "system",
        "--password", "your_password",
        "--database", "ORCL"
      ]
    }
  }
}
```

### 使用 Service Name 连接

```json
{
  "mcpServers": {
    "oracle-prod": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "oracle",
        "--host", "oracle-server.example.com",
        "--port", "1521",
        "--user", "app_user",
        "--password", "secure_password",
        "--database", "XEPDB1"
      ]
    }
  }
}
```

## 连接参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--host` | 数据库主机地址 | localhost |
| `--port` | 数据库端口 | 1521 |
| `--user` | 用户名 | - |
| `--password` | 密码 | - |
| `--database` | Service Name | - |

## 前置要求

### Oracle Instant Client

需要安装 Oracle Instant Client。请参考 [官方安装指南](https://oracle.github.io/node-oracledb/INSTALL.html)。

**macOS:**
```bash
brew install instantclient-basic
```

**Linux:**
```bash
# 下载并安装 Instant Client
# https://www.oracle.com/database/technologies/instant-client/downloads.html
```

## 使用示例

### 查看表结构

```
用户: 帮我查看 EMPLOYEES 表的结构

Claude 会自动:
1. 调用 get_table_info 工具
2. 返回表的列信息、主键、索引等
注意：Oracle 表名通常为大写
```

### 执行查询

```
用户: 查询工资最高的 10 名员工

Claude 会自动:
1. 生成 SQL: SELECT * FROM EMPLOYEES ORDER BY SALARY DESC FETCH FIRST 10 ROWS ONLY
2. 执行查询并返回结果
```

## 安全建议

### 创建只读用户

```sql
-- 创建只读用户
CREATE USER mcp_readonly IDENTIFIED BY secure_password;
GRANT CREATE SESSION TO mcp_readonly;
GRANT SELECT ANY TABLE TO mcp_readonly;

-- 或者授予特定表的权限
GRANT SELECT ON schema.table_name TO mcp_readonly;
```

## 支持的版本

- Oracle 12c
- Oracle 18c
- Oracle 19c
- Oracle 21c

## 注意事项

1. **表名大小写** - Oracle 默认表名为大写
2. **分页语法** - 使用 `FETCH FIRST n ROWS ONLY`（12c+）
3. **日期格式** - 注意 NLS_DATE_FORMAT 设置
4. **字符集** - 建议使用 AL32UTF8

## 常见问题

### ORA-12541: TNS:no listener

检查 Oracle 监听器是否启动：
```bash
lsnrctl status
```

### ORA-01017: invalid username/password

确认用户名和密码正确，注意大小写。

### 驱动安装失败

确保已正确安装 Oracle Instant Client 并设置环境变量。
