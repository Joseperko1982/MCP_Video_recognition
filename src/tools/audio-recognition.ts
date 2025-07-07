/**
 * Audio recognition tool for MCP server
 */

import { z } from 'zod';
import { createLogger } from '../utils/logger.js';
import { GeminiService } from '../services/gemini.js';
import { MongoDBService } from '../services/mongodb.js';
import { MediaDownloaderService } from '../services/media-downloader.js';
import { AudioRecognitionParamsSchema } from '../types/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AudioRecognitionParams } from '../types/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const log = createLogger('AudioRecognitionTool');

export const createAudioRecognitionTool = (
  geminiService: GeminiService,
  mongodbService: MongoDBService,
  mediaDownloaderService: MediaDownloaderService
) => {
  return {
    name: 'audio_recognition',
    description: 'Analyze and transcribe audio from file path or URL using Google Gemini AI',
    inputSchema: AudioRecognitionParamsSchema,
    callback: async (args: AudioRecognitionParams): Promise<CallToolResult> => {
      let tempFilePath: string | null = null;
      
      try {
        log.info(`Processing audio recognition request: ${args.filepath || args.url}`);
        log.verbose('Audio recognition request', JSON.stringify(args));
        
        let filepath: string;
        let fileData: Buffer;
        let mimeType: string;
        let filename: string;
        let sourceUrl: string | undefined;
        
        // Handle URL input
        if (args.url) {
          log.info(`Downloading audio from URL: ${args.url}`);
          
          // Check if we already have this media in the database
          if (args.saveToDb) {
            const existingMedia = await mongodbService.findByUrl(args.url);
            if (existingMedia && existingMedia.analysis) {
              log.info('Found existing analysis in database, returning cached result');
              return {
                content: [
                  {
                    type: 'text',
                    text: existingMedia.analysis.result
                  }
                ]
              };
            }
          }
          
          // Download the media
          const downloadResult = await mediaDownloaderService.downloadMedia(args.url);
          filepath = downloadResult.filepath;
          fileData = downloadResult.fileData;
          mimeType = downloadResult.mimeType;
          filename = downloadResult.filename;
          sourceUrl = args.url;
          tempFilePath = filepath; // Mark for cleanup
          
          // Verify it's audio
          if (!mimeType.startsWith('audio/') && !mimeType.startsWith('video/')) {
            throw new Error(`URL does not point to an audio file. MIME type: ${mimeType}`);
          }
        } 
        // Handle file path input
        else if (args.filepath) {
          filepath = args.filepath;
          
          // Verify file exists
          if (!fs.existsSync(filepath)) {
            throw new Error(`Audio file not found: ${filepath}`);
          }
          
          // Verify file is an audio
          const ext = path.extname(filepath).toLowerCase();
          if (!['.mp3', '.wav', '.ogg'].includes(ext)) {
            throw new Error(`Unsupported audio format: ${ext}. Supported formats are: .mp3, .wav, .ogg`);
          }
          
          // Read file data if we need to save to DB
          if (args.saveToDb) {
            fileData = fs.readFileSync(filepath);
            filename = path.basename(filepath);
            mimeType = `audio/${ext.substring(1)}`; // Simple MIME type inference
          }
        } else {
          throw new Error('Either filepath or url must be provided');
        }
        
        // Default prompt if not provided
        const prompt = args.prompt || 'Describe this audio';
        const modelName = args.modelname || 'gemini-2.5-flash';
        
        // Upload the file
        log.info('Uploading audio file...');
        const file = await geminiService.uploadFile(filepath);
        
        // Process with Gemini
        log.info('Generating content from audio...');
        const result = await geminiService.processFile(file, prompt, modelName);
        
        if (result.isError) {
          log.error(`Error in audio recognition: ${result.text}`);
          return {
            content: [
              {
                type: 'text',
                text: result.text
              }
            ],
            isError: true
          };
        }
        
        // Save to MongoDB if requested
        if (args.saveToDb && (fileData! || sourceUrl)) {
          try {
            log.info('Saving audio and analysis to MongoDB...');
            
            if (sourceUrl) {
              // For URL sources, save with the analysis
              await mongodbService.saveMedia(
                sourceUrl,
                filename!,
                mimeType!,
                fileData!,
                {
                  prompt,
                  result: result.text,
                  model: modelName
                }
              );
            } else if (fileData!) {
              // For file sources, also save with analysis
              await mongodbService.saveMedia(
                filepath,
                filename!,
                mimeType!,
                fileData!,
                {
                  prompt,
                  result: result.text,
                  model: modelName
                }
              );
            }
            
            log.info('Audio and analysis saved to MongoDB successfully');
          } catch (dbError) {
            log.error('Failed to save to MongoDB', dbError);
            // Don't fail the entire operation if DB save fails
          }
        }
        
        log.info('Audio recognition completed successfully');
        log.verbose('Audio recognition result', JSON.stringify(result));
        
        return {
          content: [
            {
              type: 'text',
              text: result.text
            }
          ]
        };
      } catch (error) {
        log.error('Error in audio recognition tool', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error processing audio: ${errorMessage}`
            }
          ],
          isError: true
        };
      } finally {
        // Cleanup temp file if we downloaded it
        if (tempFilePath) {
          mediaDownloaderService.cleanupTempFile(tempFilePath);
        }
      }
    }
  };
};