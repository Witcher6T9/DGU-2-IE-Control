/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

export interface KeyManagerStatus {
  hasActiveKey: boolean;
  activeKeyMasked: string;
  keyPoolCount: number;
  activeKeyIndex: number;
  rotationCount: number;
  lastAutoUpdate: string;
  autoReloadActive: boolean;
  model: string;
}

class GeminiKeyManager {
  private keys: string[] = [];
  private activeIndex: number = 0;
  private client: GoogleGenAI | null = null;
  private lastMtime: number = 0;
  private lastUpdate: Date = new Date();
  private rotationCount: number = 0;
  private checkIntervalTimer: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;

  constructor() {
    this.reloadKeysFromEnv();
    this.initFileWatcher();
  }

  /**
   * Masks API key for safe diagnostics: e.g. "AIzaSy...7qyQ"
   */
  public maskKey(key?: string): string {
    if (!key || key.length < 8) return 'None';
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Extract all valid keys from process.env and/or parsed env dictionary
   */
  private extractKeys(envObj: Record<string, string | undefined> = process.env): string[] {
    const found: string[] = [];

    // 1. Single primary key
    if (envObj.GEMINI_API_KEY && envObj.GEMINI_API_KEY.trim()) {
      found.push(envObj.GEMINI_API_KEY.trim());
    }

    // 2. Comma-separated multi-keys (GEMINI_API_KEYS=key1,key2,key3)
    if (envObj.GEMINI_API_KEYS) {
      const parts = envObj.GEMINI_API_KEYS.split(',').map(s => s.trim()).filter(Boolean);
      found.push(...parts);
    }

    // 3. Fallback key
    if (envObj.GEMINI_API_KEY_FALLBACK && envObj.GEMINI_API_KEY_FALLBACK.trim()) {
      found.push(envObj.GEMINI_API_KEY_FALLBACK.trim());
    }

    // Deduplicate while preserving order
    return Array.from(new Set(found));
  }

  /**
   * Reload keys from current process.env and disk .env
   */
  public reloadKeysFromEnv(forceResetIndex: boolean = false): boolean {
    let envFileChanged = false;
    const envPath = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
      try {
        const stats = fs.statSync(envPath);
        if (stats.mtimeMs !== this.lastMtime) {
          this.lastMtime = stats.mtimeMs;
          const parsed = dotenv.parse(fs.readFileSync(envPath));
          for (const [k, v] of Object.entries(parsed)) {
            if (v !== undefined) {
              process.env[k] = v;
            }
          }
          envFileChanged = true;
        }
      } catch (err) {
        console.warn('[GeminiKeyManager] Error reading .env file:', err);
      }
    }

    const newKeys = this.extractKeys(process.env);
    const keysChanged =
      newKeys.length !== this.keys.length ||
      newKeys.some((k, i) => k !== this.keys[i]);

    if (keysChanged || envFileChanged || !this.client) {
      this.keys = newKeys;
      if (forceResetIndex || this.activeIndex >= this.keys.length) {
        this.activeIndex = 0;
      }
      this.lastUpdate = new Date();
      this.recreateClient();
      console.log(
        `[GeminiKeyManager] Keys reloaded. Total available: ${this.keys.length}. Active: ${this.maskKey(this.getActiveKey())}`
      );
      return true;
    }

    return false;
  }

  /**
   * Automatically recreate the GoogleGenAI instance with the active key
   */
  private recreateClient(): GoogleGenAI | null {
    const activeKey = this.getActiveKey();
    if (!activeKey) {
      this.client = null;
      return null;
    }

    this.client = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    return this.client;
  }

  /**
   * Get the active API key
   */
  public getActiveKey(): string | undefined {
    if (this.keys.length === 0) return undefined;
    return this.keys[this.activeIndex % this.keys.length];
  }

  /**
   * Get GoogleGenAI client, auto-reloading if key has changed
   */
  public getClient(): GoogleGenAI | null {
    const currentKey = this.getActiveKey();
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== currentKey) {
      this.reloadKeysFromEnv();
    }

    if (!this.client && this.getActiveKey()) {
      this.recreateClient();
    }
    return this.client;
  }

  /**
   * Rotate to next available key in pool or reload from environment
   */
  public rotateKey(reason: string = 'rate_limit_or_quota'): string | undefined {
    this.rotationCount++;
    if (this.keys.length > 1) {
      this.activeIndex = (this.activeIndex + 1) % this.keys.length;
      this.lastUpdate = new Date();
      this.recreateClient();
      console.log(
        `[GeminiKeyManager] Auto-rotated API key (Reason: ${reason}). New active key: ${this.maskKey(this.getActiveKey())}`
      );
      return this.getActiveKey();
    } else {
      this.reloadKeysFromEnv(false);
      return this.getActiveKey();
    }
  }

  /**
   * Programmatic auto-update or sync of keys (hidden endpoint handler)
   */
  public async autoUpdateKey(params: {
    key?: string;
    keys?: string[];
    action?: 'update' | 'rotate' | 'reload';
  }): Promise<{ success: boolean; message: string; maskedKey?: string }> {
    const { key, keys, action } = params;

    if (action === 'rotate') {
      const nextKey = this.rotateKey('manual_or_system_action');
      return {
        success: true,
        message: 'Rotated to next key in pool',
        maskedKey: this.maskKey(nextKey),
      };
    }

    if (action === 'reload') {
      this.reloadKeysFromEnv(true);
      return {
        success: true,
        message: 'Reloaded keys from environment and disk',
        maskedKey: this.maskKey(this.getActiveKey()),
      };
    }

    // Direct key update
    if (key && typeof key === 'string' && key.trim()) {
      const trimmed = key.trim();

      // Validate key with a minimal call to ensure it is functional
      try {
        const testClient = new GoogleGenAI({
          apiKey: trimmed,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        await testClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'ping',
        });
      } catch (err: any) {
        return {
          success: false,
          message: `API Key validation failed: ${err.message || 'Invalid key'}`,
        };
      }

      // Add to front of keys and set active
      process.env.GEMINI_API_KEY = trimmed;
      if (!this.keys.includes(trimmed)) {
        this.keys.unshift(trimmed);
      }
      this.activeIndex = this.keys.indexOf(trimmed);
      this.lastUpdate = new Date();
      this.recreateClient();

      return {
        success: true,
        message: 'Gemini API key successfully validated and activated',
        maskedKey: this.maskKey(trimmed),
      };
    }

    if (Array.isArray(keys) && keys.length > 0) {
      const validKeys = keys.filter(k => typeof k === 'string' && k.trim()).map(k => k.trim());
      if (validKeys.length > 0) {
        this.keys = Array.from(new Set([...validKeys, ...this.keys]));
        this.activeIndex = 0;
        process.env.GEMINI_API_KEY = this.keys[0];
        this.lastUpdate = new Date();
        this.recreateClient();

        return {
          success: true,
          message: `Pool updated with ${validKeys.length} keys`,
          maskedKey: this.maskKey(this.getActiveKey()),
        };
      }
    }

    return {
      success: false,
      message: 'No valid key provided',
    };
  }

  /**
   * Execute an operation with automatic retry & key rotation on rate limits/auth errors
   */
  public async executeWithRetry<T>(
    operation: (client: GoogleGenAI) => Promise<T>,
    maxAttempts: number = 2
  ): Promise<T> {
    let attempt = 0;
    let lastError: any = null;

    while (attempt < Math.max(1, maxAttempts)) {
      attempt++;
      const client = this.getClient();
      if (!client) {
        throw new Error('No Gemini API key available');
      }

      try {
        return await operation(client);
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err).toLowerCase();
        const isRotatable =
          msg.includes('429') ||
          msg.includes('resource_exhausted') ||
          msg.includes('quota') ||
          msg.includes('api_key_invalid') ||
          msg.includes('unauthenticated') ||
          msg.includes('403') ||
          msg.includes('permission');

        if (isRotatable && attempt < maxAttempts) {
          console.warn(`[GeminiKeyManager] Error on attempt ${attempt}: ${err.message}. Auto-rotating key...`);
          this.rotateKey('error_retry');
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }

  /**
   * Returns hidden status information (masked keys only)
   */
  public getStatus(): KeyManagerStatus {
    return {
      hasActiveKey: !!this.getActiveKey(),
      activeKeyMasked: this.maskKey(this.getActiveKey()),
      keyPoolCount: this.keys.length,
      activeKeyIndex: this.activeIndex,
      rotationCount: this.rotationCount,
      lastAutoUpdate: this.lastUpdate.toISOString(),
      autoReloadActive: true,
      model: 'gemini-3.8-flash',
    };
  }

  /**
   * Background watcher / auto-poll for .env and system env changes
   */
  private initFileWatcher() {
    this.checkIntervalTimer = setInterval(() => {
      if (this.isChecking) return;
      this.isChecking = true;
      try {
        this.reloadKeysFromEnv(false);
      } catch {
        // silent
      } finally {
        this.isChecking = false;
      }
    }, 10000);

    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      try {
        fs.watch(envPath, () => {
          setTimeout(() => this.reloadKeysFromEnv(false), 500);
        });
      } catch {
        // fallback interval
      }
    }
  }

  public cleanup() {
    if (this.checkIntervalTimer) {
      clearInterval(this.checkIntervalTimer);
      this.checkIntervalTimer = null;
    }
  }
}

export const geminiKeyManager = new GeminiKeyManager();
