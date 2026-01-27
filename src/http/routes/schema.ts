/**
 * Schema Routes
 * Database schema and table information endpoints
 */

import type { FastifyInstance } from 'fastify';
import type { TablesResponse, ApiResponse } from '../../types/http.js';
import type { SchemaInfo, TableInfo } from '../../types/adapter.js';
import { ConnectionManager } from '../../core/connection-manager.js';

export async function setupSchemaRoutes(
  fastify: FastifyInstance,
  connectionManager: ConnectionManager
): Promise<void> {
  /**
   * GET /api/tables
   * List all tables in the database
   */
  fastify.get<{
    Querystring: { sessionId: string };
    Reply: ApiResponse<TablesResponse>;
  }>('/api/tables', {
    schema: {
      querystring: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { sessionId } = request.query;

      // Get database service
      const service = connectionManager.getService(sessionId);

      // List tables
      const tables = await service.listTables();

      return {
        success: true,
        data: { tables },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: {
          code: 'LIST_TABLES_FAILED',
          message: error instanceof Error ? error.message : 'Failed to list tables',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      };
    }
  });

  /**
   * GET /api/schema
   * Get complete database schema
   */
  fastify.get<{
    Querystring: { sessionId: string };
    Reply: ApiResponse<SchemaInfo>;
  }>('/api/schema', {
    schema: {
      querystring: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { sessionId } = request.query;

      // Get database service
      const service = connectionManager.getService(sessionId);

      // Get schema
      const schema = await service.getSchema();

      return {
        success: true,
        data: schema,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: {
          code: 'GET_SCHEMA_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get schema',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      };
    }
  });

  /**
   * GET /api/schema/:table
   * Get information about a specific table
   */
  fastify.get<{
    Params: { table: string };
    Querystring: { sessionId: string };
    Reply: ApiResponse<TableInfo>;
  }>('/api/schema/:table', {
    schema: {
      params: {
        type: 'object',
        properties: {
          table: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        required: ['sessionId'],
        properties: {
          sessionId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { table } = request.params;
      const { sessionId } = request.query;

      // Get database service
      const service = connectionManager.getService(sessionId);

      // Get table info
      const tableInfo = await service.getTableInfo(table);

      return {
        success: true,
        data: tableInfo,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: {
          code: 'GET_TABLE_INFO_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get table information',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      };
    }
  });
}
