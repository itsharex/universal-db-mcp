/**
 * Database Service
 * Core business logic for database operations
 * Shared between MCP and HTTP modes
 */

import type { DbAdapter, DbConfig, QueryResult, SchemaInfo, TableInfo } from '../types/adapter.js';
import { validateQuery } from '../utils/safety.js';

/**
 * Database Service Class
 * Encapsulates all database operations with validation and error handling
 */
export class DatabaseService {
  private adapter: DbAdapter;
  private config: DbConfig;

  constructor(adapter: DbAdapter, config: DbConfig) {
    this.adapter = adapter;
    this.config = config;
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
   */
  async getSchema(): Promise<SchemaInfo> {
    const schema = await this.adapter.getSchema();
    return schema;
  }

  /**
   * Get information about a specific table
   */
  async getTableInfo(tableName: string): Promise<TableInfo> {
    const schema = await this.getSchema();
    const table = schema.tables.find(t => t.name === tableName);

    if (!table) {
      throw new Error(`表 "${tableName}" 不存在`);
    }

    return table;
  }

  /**
   * List all tables in the database
   */
  async listTables(): Promise<string[]> {
    const schema = await this.getSchema();
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
}
