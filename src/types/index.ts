/**
 * Type definitions for the MCP server
 */

import { z } from 'zod';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Base schema for recognition parameters (without validation)
 */
export const BaseRecognitionParamsSchema = z.object({
  filepath: z.string().optional().describe('Path to the local media file to analyze'),
  url: z.string().url().optional().describe('URL of the media file to analyze'),
  prompt: z.string().default('Describe this content').describe('Custom prompt for the recognition'),
  modelname: z.string().default('gemini-2.5-flash').describe('Gemini model to use for recognition'),
  saveToDb: z.boolean().default(true).describe('Whether to save the media and analysis to MongoDB')
});

/**
 * Common parameters for all recognition tools (with validation)
 */
export const RecognitionParamsSchema = BaseRecognitionParamsSchema.refine(
  (data) => data.filepath || data.url,
  {
    message: 'Either filepath or url must be provided'
  }
);

export type RecognitionParams = z.infer<typeof RecognitionParamsSchema>;

/**
 * Video recognition specific types
 */
export const VideoRecognitionParamsSchema = BaseRecognitionParamsSchema.extend({}).refine(
  (data) => data.filepath || data.url,
  {
    message: 'Either filepath or url must be provided'
  }
);
export type VideoRecognitionParams = z.infer<typeof VideoRecognitionParamsSchema>;

/**
 * Image recognition specific types
 */
export const ImageRecognitionParamsSchema = BaseRecognitionParamsSchema.extend({}).refine(
  (data) => data.filepath || data.url,
  {
    message: 'Either filepath or url must be provided'
  }
);
export type ImageRecognitionParams = z.infer<typeof ImageRecognitionParamsSchema>;

/**
 * Audio recognition specific types
 */
export const AudioRecognitionParamsSchema = BaseRecognitionParamsSchema.extend({}).refine(
  (data) => data.filepath || data.url,
  {
    message: 'Either filepath or url must be provided'
  }
);
export type AudioRecognitionParams = z.infer<typeof AudioRecognitionParamsSchema>;

/**
 * Tool definitions
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  callback: (args: any) => Promise<CallToolResult>;
}

/**
 * Gemini API types
 */
export interface GeminiConfig {
  apiKey: string;
}

export interface GeminiFile {
  uri: string;
  mimeType: string;
  name?: string;
  state?: string;
}

export interface ProcessedGeminiFile {
  uri: string;
  mimeType: string;
  name: string;
  state: string;
}

export interface CachedFile {
  fileId: string;
  checksum: string;
  uri: string;
  mimeType: string;
  name: string;
  state: string;
  timestamp: number;
}

// File states from Gemini API
export enum FileState {
  UNSPECIFIED = 'STATE_UNSPECIFIED',
  PROCESSING = 'PROCESSING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED'
}

export interface GeminiResponse {
  text: string;
  isError?: boolean;
}
