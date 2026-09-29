/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';

/**
 * Standard supported model identifiers according to the latest Gemini API guidelines.
 * Deprecated models (gemini-1.5-*, gemini-2.0-*) are strictly prohibited.
 */
export const GEMINI_MODELS = {
  DEFAULT: 'gemini-3.8-flash',
  FAST: 'gemini-3.1-flash-lite',
  COMPLEX: 'gemini-3.1-pro-preview',
  IMAGE: 'gemini-3.1-flash-lite-image',
  TTS: 'gemini-3.1-flash-tts-preview',
  TRANSCRIBE: 'gemini-3.5-transcribe',
} as const;

export type SupportedGeminiModel = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS] | string;

/**
 * Validates that requested model is not a deprecated model.
 */
function validateModelName(modelName: string): string {
  const prohibited = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-2.0-flash',
    'gemini-2.0-pro',
    'gemini-2.0-flash-thinking',
  ];

  if (prohibited.some((p) => modelName.toLowerCase().includes(p))) {
    console.warn(`[GeminiService] Deprecated model "${modelName}" requested. Defaulting to ${GEMINI_MODELS.DEFAULT}.`);
    return GEMINI_MODELS.DEFAULT;
  }

  return modelName;
}

/**
 * Singleton Gemini client instance holder.
 */
let clientInstance: GoogleGenAI | null = null;

/**
 * Retrieves or initializes the GoogleGenAI instance using GEMINI_API_KEY from environment variables.
 * Includes the required telemetry User-Agent header 'aistudio-build'.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not defined in environment variables. Please configure GEMINI_API_KEY in the environment or secrets panel.'
    );
  }

  if (!clientInstance) {
    clientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return clientInstance;
}

export interface GenerateTextOptions {
  prompt: string;
  model?: SupportedGeminiModel;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface GenerateTextResult {
  text: string;
  modelUsed: string;
}

/**
 * Generates text from a single prompt with optional system instructions and model configs.
 */
export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const ai = getGeminiClient();
  const model = validateModelName(options.model || GEMINI_MODELS.DEFAULT);

  const response = await ai.models.generateContent({
    model,
    contents: options.prompt,
    config: {
      ...(options.systemInstruction && { systemInstruction: options.systemInstruction }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.topP !== undefined && { topP: options.topP }),
      ...(options.topK !== undefined && { topK: options.topK }),
    },
  });

  return {
    text: response.text ?? '',
    modelUsed: model,
  };
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: SupportedGeminiModel;
  systemInstruction?: string;
  temperature?: number;
}

export interface ChatResult {
  text: string;
  modelUsed: string;
}

/**
 * Executes a multi-turn conversation turn with message history.
 */
export async function chat(options: ChatOptions): Promise<ChatResult> {
  const ai = getGeminiClient();
  const model = validateModelName(options.model || GEMINI_MODELS.DEFAULT);

  const contents = options.messages.map((m) => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      ...(options.systemInstruction && { systemInstruction: options.systemInstruction }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
    },
  });

  return {
    text: response.text ?? '',
    modelUsed: model,
  };
}

export interface GenerateStructuredJsonOptions {
  prompt: string;
  model?: SupportedGeminiModel;
  systemInstruction?: string;
  responseSchema?: Record<string, any>;
  temperature?: number;
}

/**
 * Requests structured JSON from Gemini using responseMimeType and optional responseSchema.
 */
export async function generateStructuredJson<T = any>(
  options: GenerateStructuredJsonOptions
): Promise<{ data: T; rawText: string; modelUsed: string }> {
  const ai = getGeminiClient();
  const model = validateModelName(options.model || GEMINI_MODELS.DEFAULT);

  const response = await ai.models.generateContent({
    model,
    contents: options.prompt,
    config: {
      responseMimeType: 'application/json',
      ...(options.responseSchema && { responseSchema: options.responseSchema }),
      ...(options.systemInstruction && { systemInstruction: options.systemInstruction }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
    },
  });

  const rawText = response.text ?? '{}';
  let parsed: T;
  try {
    parsed = JSON.parse(rawText) as T;
  } catch (err: any) {
    throw new Error(`Failed to parse Gemini response as JSON: ${err.message}. Raw output: ${rawText}`);
  }

  return {
    data: parsed,
    rawText,
    modelUsed: model,
  };
}

export interface AnalyzeImageOptions {
  prompt: string;
  base64Data: string;
  mimeType: string;
  model?: SupportedGeminiModel;
  systemInstruction?: string;
}

/**
 * Analyzes multimodal image input alongside a textual prompt.
 */
export async function analyzeImage(options: AnalyzeImageOptions): Promise<GenerateTextResult> {
  const ai = getGeminiClient();
  const model = validateModelName(options.model || GEMINI_MODELS.DEFAULT);

  const imagePart = {
    inlineData: {
      data: options.base64Data,
      mimeType: options.mimeType,
    },
  };

  const textPart = {
    text: options.prompt,
  };

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [imagePart, textPart],
    },
    config: {
      ...(options.systemInstruction && { systemInstruction: options.systemInstruction }),
    },
  });

  return {
    text: response.text ?? '',
    modelUsed: model,
  };
}

export interface StreamTextOptions {
  prompt: string;
  model?: SupportedGeminiModel;
  systemInstruction?: string;
  temperature?: number;
  onChunk: (chunkText: string) => void;
}

/**
 * Streams generated content in real-time.
 */
export async function generateContentStream(options: StreamTextOptions): Promise<string> {
  const ai = getGeminiClient();
  const model = validateModelName(options.model || GEMINI_MODELS.DEFAULT);

  const responseStream = await ai.models.generateContentStream({
    model,
    contents: options.prompt,
    config: {
      ...(options.systemInstruction && { systemInstruction: options.systemInstruction }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
    },
  });

  let fullText = '';
  for await (const chunk of responseStream) {
    const chunkText = chunk.text ?? '';
    fullText += chunkText;
    options.onChunk(chunkText);
  }

  return fullText;
}

/**
 * Health check utility to verify GEMINI_API_KEY connectivity and presence.
 */
export async function checkGeminiHealth(): Promise<{
  ok: boolean;
  hasKey: boolean;
  model: string;
  latencyMs?: number;
  error?: string;
}> {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

  if (!hasKey) {
    return {
      ok: false,
      hasKey: false,
      model: GEMINI_MODELS.DEFAULT,
      error: 'GEMINI_API_KEY environment variable is not set.',
    };
  }

  try {
    const start = Date.now();
    const result = await generateText({
      prompt: 'ping',
      model: GEMINI_MODELS.FAST,
    });
    const latencyMs = Date.now() - start;

    return {
      ok: true,
      hasKey: true,
      model: result.modelUsed,
      latencyMs,
    };
  } catch (error: any) {
    return {
      ok: false,
      hasKey: true,
      model: GEMINI_MODELS.DEFAULT,
      error: error?.message || 'Failed to ping Gemini API',
    };
  }
}

export { Type };
