在多租户场景下使用 MCP 数据库连接器，有几种方式来处理租户隔离：

# 方式 1：在对话中明确指定租户 ID（推荐）

  每次查询时，在对话中明确告诉 Claude 要查询哪个租户的数据：

```
  你：查询 company_id = 1001 的所有订单

  Claude 会自动生成带租户过滤的 SQL：
  SELECT * FROM orders WHERE company_id = 1001;
```

  或者：

```
  你：帮我统计租户 1001 最近 7 天的订单数量

  Claude 会生成：
  SELECT COUNT(*) FROM orders
  WHERE company_id = 1001
    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

# 方式 2：设置对话上下文（更方便）

  在对话开始时，先告诉 Claude 当前的租户上下文：

```
你：我现在要查询租户 1001 的数据，接下来所有查询都针对这个租户。
```

  然后后续的查询就可以简化：

```
  你：查询所有订单

  Claude 会记住上下文，自动生成：
  SELECT * FROM orders WHERE company_id = 1001;

  你：统计用户数量

  Claude 会生成：
  SELECT COUNT(*) FROM users WHERE company_id = 1001;
```

# 方式 3：使用更自然的语言

  您也可以用更自然的方式表达：

```
  你：帮我看看公司 1001 的订单情况
  你：查询属于租户 1001 的所有用户
  你：统计 company_id 为 1001 的销售额
```

# 方式 4：批量查询多个租户

  如果需要对比多个租户的数据：

```
  你：对比租户 1001、1002、1003 的订单数量

  Claude 会生成：
  SELECT company_id, COUNT(*) as order_count
  FROM orders
  WHERE company_id IN (1001, 1002, 1003)
  GROUP BY company_id;
```

# 安全建议

1. 使用只读用户

  为了安全，建议为每个租户创建只读用户，并限制只能访问该租户的数据：

```
 -- 创建租户 1001 的只读用户
  CREATE USER 'tenant_1001_readonly'@'%' IDENTIFIED BY 'password';

  -- 只授予该租户数据的查询权限（通过视图）
  CREATE VIEW tenant_1001_orders AS
  SELECT * FROM orders WHERE company_id = 1001;

  GRANT SELECT ON tenant_1001_orders TO 'tenant_1001_readonly'@'%';
```

  然后在 Claude Desktop 配置中使用这个用户：

```json
 {
    "mcpServers": {
      "oceanbase-tenant-1001": {
        "command": "npx",
        "args": [
          "universal-db-mcp",
          "--type", "oceanbase",
          "--host", "localhost",
          "--port", "2881",
          "--user", "tenant_1001_readonly@test",
          "--password", "password",
          "--database", "mydb"
        ]
      }
    }
  }
```

2. 配置多个连接（推荐用于生产环境）

  如果您有多个重要租户，可以为每个租户配置独立的 MCP 连接：

```json
 {
    "mcpServers": {
      "oceanbase-tenant-1001": {
        "command": "npx",
        "args": [
          "universal-db-mcp",
          "--type", "oceanbase",
          "--host", "localhost",
          "--port", "2881",
          "--user", "tenant_1001@test",
          "--password", "password",
          "--database", "mydb"
        ]
      },
      "oceanbase-tenant-1002": {
        "command": "npx",
        "args": [
          "universal-db-mcp",
          "--type", "oceanbase",
          "--host", "localhost",
          "--port", "2881",
          "--user", "tenant_1002@test",
          "--password", "password",
          "--database", "mydb"
        ]
      }
    }
  }
```

  这样在对话时可以明确指定使用哪个连接。

  实际使用示例

  **场景 1：日常数据查询** 

```
  你：我要查询租户 1001 的数据

  Claude：好的，我会在后续查询中自动添加 company_id = 1001 的过滤条件。

  你：查看最近 10 条订单

  Claude 执行：
  SELECT * FROM orders
  WHERE company_id = 1001
  ORDER BY created_at DESC
  LIMIT 10;
```

  **场景 2：数据分析** 

```
 你：帮我分析租户 1001 最近一个月的销售趋势

  Claude 会：

1. 查询该租户的订单数据
2. 按日期分组统计
3. 生成趋势分析报告

  执行的 SQL：
  SELECT
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(amount) as total_amount
  FROM orders
  WHERE company_id = 1001
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY DATE(created_at)
  ORDER BY date;
```

 

  **场景 3：跨租户对比** 

```
你：对比租户 1001 和 1002 的活跃用户数

  Claude 执行：
  SELECT
      company_id,
      COUNT(DISTINCT user_id) as active_users
  FROM user_activities
  WHERE company_id IN (1001, 1002)
    AND activity_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  GROUP BY company_id;
```

# 总结

  核心要点：
  1. MCP 连接器本身不需要特殊配置，它只是执行 SQL
  2. 租户隔离在 SQL 层面实现，通过 WHERE company_id = xxx 条件
  3. 在对话中明确指定租户 ID，Claude 会自动在 SQL 中添加过滤条件
  4. 可以设置对话上下文，让 Claude 记住当前操作的租户
  5. 生产环境建议使用数据库级别的权限控制，为每个租户创建独立用户

  这种方式既灵活又安全，Claude 会智能地理解您的意图并生成正确的 SQL 查询。