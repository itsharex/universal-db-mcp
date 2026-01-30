# 安全最佳实践

本文档介绍 Universal DB MCP 的安全配置和最佳实践。

## 安全模式

### 只读模式（默认）

默认情况下，工具运行在**只读模式**，会拒绝所有写入操作：

- DELETE
- UPDATE
- INSERT
- DROP
- TRUNCATE
- ALTER
- CREATE

这是最安全的配置，推荐在生产环境使用。

### 写入模式

如需执行写入操作，需要显式添加参数：

```bash
--danger-allow-write
```

**警告**：启用写入模式后，Claude 可以修改你的数据库。请仅在开发环境使用。

## 数据库账号安全

### 使用专用账号

为 MCP 创建专用的数据库账号，遵循最小权限原则。

#### MySQL

```sql
-- 创建只读用户
CREATE USER 'mcp_readonly'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT ON mydb.* TO 'mcp_readonly'@'%';
FLUSH PRIVILEGES;
```

#### PostgreSQL

```sql
-- 创建只读用户
CREATE USER mcp_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO mcp_readonly;
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;
```

#### Oracle

```sql
-- 创建只读用户
CREATE USER mcp_readonly IDENTIFIED BY secure_password;
GRANT CREATE SESSION TO mcp_readonly;
GRANT SELECT ANY TABLE TO mcp_readonly;
```

### 密码安全

1. **使用强密码** - 至少 16 位，包含大小写字母、数字和特殊字符
2. **定期轮换** - 定期更换数据库密码
3. **不要硬编码** - 使用环境变量存储密码

## API Key 安全

### 生成强密钥

```bash
# 生成 32 字节的随机密钥
openssl rand -hex 32
```

### 配置多个密钥

支持配置多个 API Key，便于轮换和撤销：

```bash
API_KEYS=key1,key2,key3
```

### 密钥轮换

1. 添加新密钥到配置
2. 更新客户端使用新密钥
3. 移除旧密钥

## 网络安全

### 不要直接暴露数据库

数据库不应该直接暴露到公网。推荐架构：

```
用户 → Nginx (HTTPS) → MCP 服务 → 数据库
```

### 使用 VPN 或跳板机

访问生产数据库时：

1. **VPN** - 通过企业 VPN 连接
2. **SSH 隧道** - 通过跳板机建立隧道
3. **内网访问** - 在同一 VPC 内访问

### 防火墙配置

只允许必要的端口：

```bash
# UFW 示例
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# 不要开放数据库端口到公网
```

## HTTPS 配置

生产环境必须使用 HTTPS：

1. 使用 Let's Encrypt 免费证书
2. 配置 Nginx 反向代理
3. 强制 HTTP 重定向到 HTTPS

详见 [HTTPS 配置指南](../deployment/https-domain.md)。

## 速率限制

配置速率限制防止滥用：

```bash
RATE_LIMIT_MAX=100      # 最大请求数
RATE_LIMIT_WINDOW=1m    # 时间窗口
```

## 日志和审计

### 启用日志

```bash
LOG_LEVEL=info
```

### 定期审计

1. 检查访问日志
2. 监控异常查询
3. 审计数据库操作

## 安全检查清单

### 部署前

- [ ] 使用只读数据库账号
- [ ] 配置强 API Key
- [ ] 启用 HTTPS
- [ ] 配置防火墙
- [ ] 设置速率限制

### 运行时

- [ ] 定期检查日志
- [ ] 监控异常访问
- [ ] 及时更新版本

### 定期维护

- [ ] 轮换 API Key
- [ ] 更新数据库密码
- [ ] 审计访问权限

## 常见安全问题

### SQL 注入

MCP 使用参数化查询，已内置 SQL 注入防护。但仍需注意：

1. 不要在查询中拼接用户输入
2. 使用参数化查询

### 敏感数据泄露

1. 不要在日志中记录敏感数据
2. 配置适当的访问权限
3. 使用数据脱敏

### 未授权访问

1. 始终配置 API Key
2. 使用 HTTPS
3. 限制网络访问
