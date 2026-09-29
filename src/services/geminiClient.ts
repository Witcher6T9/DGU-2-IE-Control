/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Frontend client helper for communicating with the server-side Gemini API endpoints.
 * All API key access remains strictly server-side.
 */

export interface ClientGenerateOptions {
  prompt: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface ClientChatOptions {
  messages: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface ClientJsonOptions {
  prompt: string;
  model?: string;
  systemInstruction?: string;
  responseSchema?: Record<string, any>;
}

export const geminiClient = {
  /**
   * Check whether the server has GEMINI_API_KEY properly configured.
   */
  async checkHealth(): Promise<{ ok: boolean; hasKey: boolean; model: string; latencyMs?: number; error?: string }> {
    try {
      const res = await fetch('/api/gemini/health');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          ok: false,
          hasKey: false,
          model: 'gemini-3.8-flash',
          error: data.error || `Server responded with status ${res.status}`,
        };
      }
      return await res.json();
    } catch (err: any) {
      return {
        ok: false,
        hasKey: false,
        model: 'gemini-3.8-flash',
        error: err.message || 'Unable to reach backend server',
      };
    }
  },

  /**
   * Request text generation from the server.
   */
  async generateText(options: ClientGenerateOptions): Promise<{ text: string; modelUsed: string }> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(err.error || `Generation failed with status ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Send a multi-turn conversation turn.
   */
  async chat(options: ClientChatOptions): Promise<{ text: string; modelUsed: string }> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(err.error || `Chat turn failed with status ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Request structured JSON generation.
   */
  async generateStructuredJson<T = any>(options: ClientJsonOptions): Promise<{ data: T; rawText: string; modelUsed: string }> {
    const res = await fetch('/api/gemini/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(err.error || `JSON generation failed with status ${res.status}`);
    }

    return await res.json();
  },
};
