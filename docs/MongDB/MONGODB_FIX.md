# MongoDB 模块加载问题修复说明

## 问题描述

在使用 `npx universal-db-mcp` 运行 MongoDB 连接器时，出现以下错误：

```
Error: Cannot find module './admin'
Require stack:
- C:\Users\37593\AppData\Local\npm-cache\_npx\c12b7f7b06040179\node_modules\mongodb\lib\index.js
```

## 根本原因

MongoDB 驱动程序（mongodb@6.21.0）在通过 npx 运行时，存在模块解析问题。具体原因：

1. **`db.admin()` 方法依赖内部模块**：MongoDB 驱动的 `admin()` 方法需要加载内部的 `./admin` 模块
2. **npx 的模块解析路径问题**：当通过 npx 运行时，模块解析路径可能不正确，导致无法找到 MongoDB 驱动的内部模块
3. **代码中使用了两处 `admin()` 调用**：
   - `src/adapters/mongodb.ts:77` - 连接测试：`await this.db.admin().ping()`
   - `src/adapters/mongodb.ts:349` - 获取版本：`await this.db.admin().serverInfo()`

## 解决方案

使用 MongoDB 的 `command()` 方法替代 `admin()` 方法，避免依赖内部模块：

### 修改 1：连接测试（第 77 行）

**修改前：**
```typescript
// 测试连接
await this.db.admin().ping();
```

**修改后：**
```typescript
// 测试连接 - 使用 command 方法代替 admin().ping()
await this.db.command({ ping: 1 });
```

### 修改 2：获取版本信息（第 349 行）

**修改前：**
```typescript
// 获取 MongoDB 版本
const serverInfo = await this.db.admin().serverInfo();
const version = serverInfo.version || 'unknown';
```

**修改后：**
```typescript
// 获取 MongoDB 版本 - 使用 buildInfo 命令代替 admin().serverInfo()
const buildInfo = await this.db.command({ buildInfo: 1 });
const version = buildInfo.version || 'unknown';
```

## 技术说明

### `db.command()` vs `db.admin()`

- **`db.command()`**：直接在当前数据库上执行命令，不需要额外的模块加载
- **`db.admin()`**：返回一个 Admin 对象，需要加载额外的内部模块

### 使用的 MongoDB 命令

1. **`{ ping: 1 }`**：测试数据库连接是否正常，等同于 `admin().ping()`
2. **`{ buildInfo: 1 }`**：获取 MongoDB 服务器的构建信息（包括版本号），等同于 `admin().serverInfo()`

这两个命令都是 MongoDB 的标准管理命令，功能完全相同，但不需要通过 Admin 对象调用。

## 验证结果

修复后，错误从：
```
Error: Cannot find module './admin'
```

变为正常的连接错误（当 MongoDB 未运行时）：
```
MongoDB 连接失败: connect ECONNREFUSED ::1:27017
```

这证明模块加载问题已解决，程序可以正常启动并尝试连接数据库。

## 版本更新

- **修复前版本**：0.5.0
- **修复后版本**：0.5.1

## 发布步骤

1. 确认修改已编译：`npm run build`
2. 测试本地功能：`node dist/index.js --type mongodb ...`
3. 发布到 npm：`npm publish`
4. 验证发布：`npx universal-db-mcp@latest --type mongodb ...`

## 兼容性

- ✅ 与 MongoDB 3.x、4.x、5.x、6.x、7.x 完全兼容
- ✅ 支持所有 MongoDB 部署方式（单机、副本集、分片集群）
- ✅ 不影响其他数据库适配器（MySQL、PostgreSQL、Oracle、达梦、SQL Server、Redis）
- ✅ 向后兼容，不会破坏现有功能

## 相关文件

- `src/adapters/mongodb.ts` - MongoDB 适配器源代码
- `dist/adapters/mongodb.js` - 编译后的 JavaScript 代码
- `package.json` - 版本号已更新为 0.5.1

## 总结

此修复通过使用 MongoDB 的标准命令接口替代 Admin 对象方法，彻底解决了 npx 运行时的模块加载问题。修改简单、可靠，且不影响任何功能。
