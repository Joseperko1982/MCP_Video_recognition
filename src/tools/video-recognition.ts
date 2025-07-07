/**
 * Video recognition tool for MCP server
 */

import { z } from 'zod';
import { createLogger } from '../utils/logger.js';
import { GeminiService } from '../services/gemini.js';
import { MongoDBService } from '../services/mongodb.js';
import { MediaDownloaderService } from '../services/media-downloader.js';
import { VideoRecognitionParamsSchema, FileState } from '../types/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { VideoRecognitionParams } from '../types/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const log = createLogger('VideoRecognitionTool');

export const createVideoRecognitionTool = (
  geminiService: GeminiService,
  mongodbService: MongoDBService,
  mediaDownloaderService: MediaDownloaderService
) => {
  return {
    name: 'video_recognition',
    description: 'Analyze and describe videos from file path or URL using Google Gemini AI',
    inputSchema: VideoRecognitionParamsSchema,
    callback: async (args: VideoRecognitionParams): Promise<CallToolResult> => {
      let tempFilePath: string | null = null;
      
      try {
        log.info(`Processing video recognition request: ${args.filepath || args.url}`);
        log.verbose('Video recognition request', JSON.stringify(args));
        
        let filepath: string;
        let fileData: Buffer;
        let mimeType: string;
        let filename: string;
        let sourceUrl: string | undefined;
        
        // Handle URL input
        if (args.url) {
          log.info(`Downloading video from URL: ${args.url}`);
          
          // Check if we already have this media in the database
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
          
          // Download the media
          const downloadResult = await mediaDownloaderService.downloadMedia(args.url);
          filepath = downloadResult.filepath;
          fileData = downloadResult.fileData;
          mimeType = downloadResult.mimeType;
          filename = downloadResult.filename;
          sourceUrl = args.url;
          tempFilePath = filepath; // Mark for cleanup
          
          // Verify it's a video
          if (!mimeType.startsWith('video/')) {
            throw new Error(`URL does not point to a video file. MIME type: ${mimeType}`);
          }
        } 
        // Handle file path input
        else if (args.filepath) {
          filepath = args.filepath;
          
          // Verify file exists
          if (!fs.existsSync(filepath)) {
            throw new Error(`Video file not found: ${filepath}`);
          }
          
          // Verify file is a video
          const ext = path.extname(filepath).toLowerCase();
          if (ext !== '.mp4' && ext !== '.mpeg' && ext !== '.mov' && ext !== '.avi' && ext !== '.webm') {
            throw new Error(`Unsupported video format: ${ext}. Supported formats are: .mp4, .mpeg, .mov, .avi, .webm`);
          }
          
          // Read file data if we need to save to DB
          if (args.saveToDb) {
            fileData = fs.readFileSync(filepath);
            filename = path.basename(filepath);
            mimeType = `video/${ext.substring(1)}`; // Simple MIME type inference
          }
        } else {
          throw new Error('Either filepath or url must be provided');
        }
        
        // Default prompt if not provided
        const prompt = args.prompt || 'Describe this video';
        const modelName = args.modelname || 'gemini-2.5-flash';
        
        // Upload the file - this will handle waiting for video processing
        log.info('Uploading and processing video file...');
        const file = await geminiService.uploadFile(filepath);
        
        // Process with Gemini
        log.info('Video processing complete, generating content...');
        const result = await geminiService.processFile(file, prompt, modelName);
        
        if (result.isError) {
          log.error(`Error in video recognition: ${result.text}`);
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
        if (args.saveToDb) {
          try {
            log.info('Saving video and analysis to MongoDB...');
            
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
            } else {
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
            
            log.info('Video and analysis saved to MongoDB successfully');
          } catch (dbError) {
            log.error('Failed to save to MongoDB', dbError);
            // Don't fail the entire operation if DB save fails
          }
        }
        
        log.info('Video recognition completed successfully');
        log.verbose('Video recognition result', JSON.stringify(result));
        
        return {
          content: [
            {
              type: 'text',
              text: result.text
            }
          ]
        };
      } catch (error) {
        log.error('Error in video recognition tool', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error processing video: ${errorMessage}`
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