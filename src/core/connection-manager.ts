/**
 * Connection Manager
 * Manages database connections and sessions
 * Supports both single-connection (MCP) and multi-session (HTTP) modes
 */

import { nanoid } from 'nanoid';
import type { DbAdapter, DbConfig } from '../types/adapter.js';
import type { Session } from '../types/http.js';
import { createAdapter } from '../utils/adapter-factory.js';
import { DatabaseService } from './database-service.js';

/**
 * Connection Manager Class
 */
export class ConnectionManager {
  private sessions: Map<string, Session> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  private sessionTimeout: number;

  constructor(sessionTimeout: number = 3600000, cleanupInterval: number = 300000) {
    this.sessionTimeout = sessionTimeout;

    // Start cleanup interval
    if (cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpiredSessions();
      }, cleanupInterval);
    }
  }

  /**
   * Create a new connection and return session ID
   */
  async connect(config: DbConfig): Promise<string> {
    // Create adapter
    const adapter = createAdapter(config);

    // Connect to database
    await adapter.connect();

    // Generate session ID
    const sessionId = nanoid();

    // Store session
    const session: Session = {
      id: sessionId,
      adapter,
      config,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    return sessionId;
  }

  /**
   * Disconnect a session
   */
  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`);
    }

    // Disconnect adapter
    await session.adapter.disconnect();

    // Remove session
    this.sessions.delete(sessionId);
  }

  /**
   * Get adapter for a session
   */
  getAdapter(sessionId: string): DbAdapter {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在或已过期`);
    }

    // Update last accessed time
    session.lastAccessedAt = new Date();

    return session.adapter;
  }

  /**
   * Get database service for a session
   */
  getService(sessionId: string): DatabaseService {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在或已过期`);
    }

    // Update last accessed time
    session.lastAccessedAt = new Date();

    return new DatabaseService(session.adapter, session.config);
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get all session IDs
   */
  getSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastAccessed = session.lastAccessedAt.getTime();
      const elapsed = now - lastAccessed;

      if (elapsed > this.sessionTimeout) {
        // Disconnect and remove expired session
        session.adapter.disconnect().catch((err: Error) => {
          console.error(`清理会话 ${sessionId} 时出错:`, err);
        });

        this.sessions.delete(sessionId);
        console.log(`🧹 清理过期会话: ${sessionId}`);
      }
    }
  }

  /**
   * Disconnect all sessions and stop cleanup
   */
  async disconnectAll(): Promise<void> {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Disconnect all sessions
    const disconnectPromises = Array.from(this.sessions.values()).map(session =>
      session.adapter.disconnect().catch((err: Error) => {
        console.error(`断开会话 ${session.id} 时出错:`, err);
      })
    );

    await Promise.all(disconnectPromises);

    // Clear sessions
    this.sessions.clear();
  }
}
