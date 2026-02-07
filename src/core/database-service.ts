/**
 * Database Service
 * Core business logic for database operations
 * Shared between MCP and HTTP modes
 */

import type { DbAdapter, DbConfig, QueryResult, SchemaInfo, TableInfo, EnumValuesResult, SampleDataResult } from '../types/adapter.js';
import { validateQuery } from '../utils/safety.js';
import { SchemaEnhancer, SchemaEnhancerConfig } from '../utils/schema-enhancer.js';
import { DataMasker, createDataMasker } from '../utils/data-masking.js';

/**
 * Schema 缓存配置
 */
export interface SchemaCacheConfig {
  /** 缓存过期时间（毫秒），默认 5 分钟 */
  ttl: number;
  /** 是否启用缓存，默认 true */
  enabled: boolean;
}

/**
 * Schema 增强配置（导出供外部使用）
 */
export type { SchemaEnhancerConfig };

/**
 * Schema 缓存统计信息
 */
export interface SchemaCacheStats {
  /** 缓存是否有效 */
  isCached: boolean;
  /** 缓存时间 */
  cachedAt: Date | null;
  /** 缓存过期时间 */
  expiresAt: Date | null;
  /** 缓存命中次数 */
  hitCount: number;
  /** 缓存未命中次数 */
  missCount: number;
}

/**
 * 默认缓存配置
 */
const DEFAULT_CACHE_CONFIG: SchemaCacheConfig = {
  ttl: 5 * 60 * 1000, // 5 分钟
  enabled: true,
};

/**
 * Database Service Class
 * Encapsulates all database operations with validation and error handling
 */
export class DatabaseService {
  private adapter: DbAdapter;
  private config: DbConfig;

  // Schema 缓存相关
  private schemaCache: SchemaInfo | null = null;
  private schemaCacheTime: number = 0;
  private cacheConfig: SchemaCacheConfig;
  private cacheHitCount: number = 0;
  private cacheMissCount: number = 0;

  // Schema 增强器
  private schemaEnhancer: SchemaEnhancer;

  // 数据脱敏器
  private dataMasker: DataMasker;

  constructor(
    adapter: DbAdapter,
    config: DbConfig,
    cacheConfig?: Partial<SchemaCacheConfig>,
    enhancerConfig?: Partial<SchemaEnhancerConfig>
  ) {
    this.adapter = adapter;
    this.config = config;
    this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    this.schemaEnhancer = new SchemaEnhancer(enhancerConfig);
    this.dataMasker = createDataMasker(true);
  }

  /**
   * Execute a query with validation
   */
  async executeQuery(query: string, params?: unknown[]): Promise<QueryResult> {
    // Validate query safety
    this.validateQuery(query);

    // Execute query
    const result = await this.adapter.executeQuery(query, params);

    return result;
  }

  /**
   * Get complete database schema
   * @param forceRefresh - 是否强制刷新缓存，忽略现有缓存
   */
  async getSchema(forceRefresh: boolean = false): Promise<SchemaInfo> {
    const now = Date.now();

    // 检查是否可以使用缓存
    if (
      !forceRefresh &&
      this.cacheConfig.enabled &&
      this.schemaCache &&
      (now - this.schemaCacheTime) < this.cacheConfig.ttl
    ) {
      this.cacheHitCount++;
      console.error(`📦 Schema 缓存命中 (命中率: ${this.getCacheHitRate()}%)`);
      return this.schemaCache;
    }

    // 缓存未命中或已过期，重新获取
    this.cacheMissCount++;
    console.error(`🔄 正在获取数据库 Schema${forceRefresh ? ' (强制刷新)' : this.schemaCache ? ' (缓存已过期)' : ' (首次加载)'}...`);

    const startTime = Date.now();
    const schema = await this.adapter.getSchema();
    const elapsed = Date.now() - startTime;

    // 增强 Schema 信息（隐式关系推断、关系类型细化）
    const enhancedSchema = this.enhanceSchema(schema);

    // 更新缓存
    if (this.cacheConfig.enabled) {
      this.schemaCache = enhancedSchema;
      this.schemaCacheTime = now;

      // 统计增强信息
      const explicitRelCount = schema.relationships?.length || 0;
      const totalRelCount = enhancedSchema.relationships?.length || 0;
      const inferredRelCount = totalRelCount - explicitRelCount;

      console.error(`✅ Schema 已缓存 (获取耗时: ${elapsed}ms, 表数量: ${enhancedSchema.tables.length}, 显式关系: ${explicitRelCount}, 推断关系: ${inferredRelCount}, 缓存有效期: ${this.cacheConfig.ttl / 1000}秒)`);
    }

    return enhancedSchema;
  }

  /**
   * 增强 Schema 信息
   * - 为现有外键关系添加 source 标记
   * - 推断隐式关系
   * - 细化关系类型
   */
  private enhanceSchema(schema: SchemaInfo): SchemaInfo {
    // 对于 NoSQL 数据库（Redis、MongoDB），不进行关系增强
    if (schema.databaseType === 'redis' || schema.databaseType === 'mongodb') {
      return schema;
    }

    // 增强关系信息
    const existingRelationships = schema.relationships || [];
    const enhancedRelationships = this.schemaEnhancer.enhanceRelationships(
      schema.tables,
      existingRelationships
    );

    return {
      ...schema,
      relationships: enhancedRelationships.length > 0 ? enhancedRelationships : undefined,
    };
  }

  /**
   * Get information about a specific table
   * @param tableName - 表名
   * @param forceRefresh - 是否强制刷新缓存
   */
  async getTableInfo(tableName: string, forceRefresh: boolean = false): Promise<TableInfo> {
    const schema = await this.getSchema(forceRefresh);

    // 支持大小写不敏感的表名匹配
    const table = schema.tables.find(t =>
      t.name === tableName ||
      t.name.toLowerCase() === tableName.toLowerCase()
    );

    if (!table) {
      throw new Error(`表 "${tableName}" 不存在`);
    }

    return table;
  }

  /**
   * List all tables in the database
   * @param forceRefresh - 是否强制刷新缓存
   */
  async listTables(forceRefresh: boolean = false): Promise<string[]> {
    const schema = await this.getSchema(forceRefresh);
    return schema.tables.map(t => t.name);
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple query to test connection
      await this.adapter.executeQuery('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 清除 Schema 缓存
   */
  clearSchemaCache(): void {
    this.schemaCache = null;
    this.schemaCacheTime = 0;
    console.error('🗑️ Schema 缓存已清除');
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): SchemaCacheStats {
    const now = Date.now();
    const isCached = this.schemaCache !== null && (now - this.schemaCacheTime) < this.cacheConfig.ttl;

    return {
      isCached,
      cachedAt: this.schemaCacheTime > 0 ? new Date(this.schemaCacheTime) : null,
      expiresAt: this.schemaCacheTime > 0 ? new Date(this.schemaCacheTime + this.cacheConfig.ttl) : null,
      hitCount: this.cacheHitCount,
      missCount: this.cacheMissCount,
    };
  }

  /**
   * 获取缓存命中率
   */
  getCacheHitRate(): string {
    const total = this.cacheHitCount + this.cacheMissCount;
    if (total === 0) return '0.00';
    return ((this.cacheHitCount / total) * 100).toFixed(2);
  }

  /**
   * 更新缓存配置
   */
  updateCacheConfig(config: Partial<SchemaCacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    console.error(`⚙️ 缓存配置已更新: TTL=${this.cacheConfig.ttl}ms, 启用=${this.cacheConfig.enabled}`);
  }

  /**
   * 更新 Schema 增强配置
   */
  updateEnhancerConfig(config: Partial<SchemaEnhancerConfig>): void {
    this.schemaEnhancer.updateConfig(config);
    // 清除缓存以便下次获取时应用新配置
    this.clearSchemaCache();
    console.error(`⚙️ Schema 增强配置已更新`);
  }

  /**
   * 获取 Schema 增强配置
   */
  getEnhancerConfig(): SchemaEnhancerConfig {
    return this.schemaEnhancer.getConfig();
  }

  /**
   * Validate query against write permissions
   */
  private validateQuery(query: string): void {
    validateQuery(query, this.config.allowWrite ?? false);
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): DbAdapter {
    return this.adapter;
  }

  /**
   * Get the configuration
   */
  getConfig(): DbConfig {
    return this.config;
  }

  /**
   * 获取指定列的枚举值
   * 用于帮助 LLM 了解 status、type 等枚举列的所有可能值
   *
   * @param tableName - 表名
   * @param columnName - 列名
   * @param limit - 最大返回数量（默认 50，最大 100）
   * @param includeCount - 是否包含每个值的出现次数（默认 false）
   * @returns 枚举值查询结果
   */
  async getEnumValues(
    tableName: string,
    columnName: string,
    limit: number = 50,
    includeCount: boolean = false
  ): Promise<EnumValuesResult> {
    // 检查是否为 NoSQL 数据库
    if (this.config.type === 'redis' || this.config.type === 'mongodb') {
      throw new Error(
        `${this.config.type} 是 NoSQL 数据库，不支持 get_enum_values 工具。` +
        `请使用 execute_query 工具直接查询。`
      );
    }

    // 1. 验证表和列是否存在
    const tableInfo = await this.getTableInfo(tableName);
    const column = tableInfo.columns.find(
      c => c.name.toLowerCase() === columnName.toLowerCase()
    );

    if (!column) {
      throw new Error(
        `列 "${columnName}" 在表 "${tableName}" 中不存在。` +
        `该表的列有: ${tableInfo.columns.map(c => c.name).join(', ')}`
      );
    }

    // 使用实际的列名（保持原始大小写）
    const actualColumnName = column.name;
    const actualTableName = tableInfo.name;

    // 2. 限制返回数量（安全限制）
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // 3. 构建查询 SQL
    let query: string;
    if (includeCount) {
      query = this.buildEnumValuesQueryWithCount(actualTableName, actualColumnName, safeLimit + 1);
    } else {
      query = this.buildEnumValuesQuery(actualTableName, actualColumnName, safeLimit + 1);
    }

    // 4. 执行查询
    const result = await this.adapter.executeQuery(query);

    // 5. 处理结果
    const hasMore = result.rows.length > safeLimit;
    const rows = hasMore ? result.rows.slice(0, safeLimit) : result.rows;

    const values = rows.map(row => row.value as string | number | null);
    const valueCounts = includeCount
      ? Object.fromEntries(rows.map(row => [String(row.value), Number(row.count)]))
      : undefined;

    return {
      tableName: actualTableName,
      columnName: actualColumnName,
      values,
      totalCount: values.length,
      isEnum: !hasMore,
      valueCounts,
      columnType: column.type,
    };
  }

  /**
   * 获取表的示例数据（已脱敏）
   * 用于帮助 LLM 理解数据格式（日期格式、ID 格式等）
   *
   * @param tableName - 表名
   * @param columns - 要查看的列（可选，默认全部）
   * @param limit - 返回行数（默认 3，最大 10）
   * @returns 示例数据查询结果
   */
  async getSampleData(
    tableName: string,
    columns?: string[],
    limit: number = 3
  ): Promise<SampleDataResult> {
    // 检查是否为 NoSQL 数据库
    if (this.config.type === 'redis' || this.config.type === 'mongodb') {
      throw new Error(
        `${this.config.type} 是 NoSQL 数据库，不支持 get_sample_data 工具。` +
        `请使用 execute_query 工具直接查询。`
      );
    }

    // 1. 验证表是否存在
    const tableInfo = await this.getTableInfo(tableName);
    const actualTableName = tableInfo.name;

    // 2. 验证并确定要查询的列
    let selectedColumns: string[];
    if (columns && columns.length > 0) {
      const validColumns = tableInfo.columns.map(c => c.name.toLowerCase());
      const invalidColumns = columns.filter(c => !validColumns.includes(c.toLowerCase()));
      if (invalidColumns.length > 0) {
        throw new Error(
          `列 "${invalidColumns.join(', ')}" 在表 "${tableName}" 中不存在。` +
          `该表的列有: ${tableInfo.columns.map(c => c.name).join(', ')}`
        );
      }
      // 使用实际的列名（保持原始大小写）
      selectedColumns = columns.map(c => {
        const found = tableInfo.columns.find(col => col.name.toLowerCase() === c.toLowerCase());
        return found ? found.name : c;
      });
    } else {
      // 默认查询所有列
      selectedColumns = tableInfo.columns.map(c => c.name);
    }

    // 3. 限制返回行数（安全限制）
    const safeLimit = Math.min(Math.max(1, limit), 10);

    // 4. 构建查询 SQL
    const query = this.buildSampleDataQuery(actualTableName, selectedColumns, safeLimit);

    // 5. 执行查询
    const result = await this.adapter.executeQuery(query);

    // 6. 脱敏处理
    const { maskedRows, maskedColumns } = this.dataMasker.maskRows(result.rows);

    return {
      tableName: actualTableName,
      columns: selectedColumns,
      rows: maskedRows,
      rowCount: maskedRows.length,
      masked: maskedColumns.length > 0,
      maskedColumns: maskedColumns.length > 0 ? maskedColumns : undefined,
    };
  }

  /**
   * 构建枚举值查询 SQL（不含计数）
   */
  private buildEnumValuesQuery(tableName: string, columnName: string, limit: number): string {
    const quotedTable = this.quoteIdentifier(tableName);
    const quotedColumn = this.quoteIdentifier(columnName);

    const baseQuery = `SELECT DISTINCT ${quotedColumn} as value FROM ${quotedTable} WHERE ${quotedColumn} IS NOT NULL`;

    return this.appendLimit(baseQuery, limit);
  }

  /**
   * 构建枚举值查询 SQL（含计数）
   */
  private buildEnumValuesQueryWithCount(tableName: string, columnName: string, limit: number): string {
    const quotedTable = this.quoteIdentifier(tableName);
    const quotedColumn = this.quoteIdentifier(columnName);

    const baseQuery = `SELECT ${quotedColumn} as value, COUNT(*) as count FROM ${quotedTable} WHERE ${quotedColumn} IS NOT NULL GROUP BY ${quotedColumn} ORDER BY count DESC`;

    return this.appendLimit(baseQuery, limit);
  }

  /**
   * 构建示例数据查询 SQL
   */
  private buildSampleDataQuery(tableName: string, columns: string[], limit: number): string {
    const quotedTable = this.quoteIdentifier(tableName);
    const quotedColumns = columns.map(c => this.quoteIdentifier(c)).join(', ');

    const baseQuery = `SELECT ${quotedColumns} FROM ${quotedTable}`;

    return this.appendLimit(baseQuery, limit);
  }

  /**
   * 引用标识符（表名、列名）
   * 根据数据库类型使用不同的引号
   */
  private quoteIdentifier(identifier: string): string {
    const dbType = this.config.type;

    switch (dbType) {
      case 'mysql':
      case 'tidb':
      case 'oceanbase':
      case 'polardb':
      case 'goldendb':
        // MySQL 系使用反引号
        return `\`${identifier}\``;

      case 'sqlserver':
        // SQL Server 使用方括号
        return `[${identifier}]`;

      default:
        // PostgreSQL, Oracle, SQLite, 达梦, KingbaseES, GaussDB, Vastbase, HighGo, ClickHouse 等使用双引号
        return `"${identifier}"`;
    }
  }

  /**
   * 添加 LIMIT 子句
   * 根据数据库类型使用不同的语法
   */
  private appendLimit(query: string, limit: number): string {
    const dbType = this.config.type;

    switch (dbType) {
      case 'oracle':
      case 'dm':
        // Oracle/达梦 使用 FETCH FIRST
        return `${query} FETCH FIRST ${limit} ROWS ONLY`;

      case 'sqlserver':
        // SQL Server 使用 TOP（需要插入到 SELECT 后面）
        return query.replace(/^SELECT/i, `SELECT TOP ${limit}`);

      default:
        // MySQL, PostgreSQL, SQLite, TiDB, ClickHouse 等使用 LIMIT
        return `${query} LIMIT ${limit}`;
    }
  }
}
