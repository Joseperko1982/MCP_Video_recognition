/**
 * Image recognition tool for MCP server
 */

import { z } from 'zod';
import { createLogger } from '../utils/logger.js';
import { GeminiService } from '../services/gemini.js';
import { MongoDBService } from '../services/mongodb.js';
import { MediaDownloaderService } from '../services/media-downloader.js';
import { ImageRecognitionParamsSchema } from '../types/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ImageRecognitionParams } from '../types/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const log = createLogger('ImageRecognitionTool');

export const createImageRecognitionTool = (
  geminiService: GeminiService,
  mongodbService: MongoDBService,
  mediaDownloaderService: MediaDownloaderService
) => {
  return {
    name: 'image_recognition',
    description: 'Analyze and describe images from file path or URL using Google Gemini AI',
    inputSchema: ImageRecognitionParamsSchema,
    callback: async (args: ImageRecognitionParams): Promise<CallToolResult> => {
      let tempFilePath: string | null = null;
      
      try {
        log.info(`Processing image recognition request: ${args.filepath || args.url}`);
        log.verbose('Image recognition request', JSON.stringify(args));
        
        let filepath: string;
        let fileData: Buffer;
        let mimeType: string;
        let filename: string;
        let sourceUrl: string | undefined;
        
        // Handle URL input
        if (args.url) {
          log.info(`Downloading image from URL: ${args.url}`);
          
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
          
          // Verify it's an image
          if (!mimeType.startsWith('image/')) {
            throw new Error(`URL does not point to an image file. MIME type: ${mimeType}`);
          }
        } 
        // Handle file path input
        else if (args.filepath) {
          filepath = args.filepath;
          
          // Verify file exists
          if (!fs.existsSync(filepath)) {
            throw new Error(`Image file not found: ${filepath}`);
          }
          
          // Verify file is an image
          const ext = path.extname(filepath).toLowerCase();
          if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            throw new Error(`Unsupported image format: ${ext}. Supported formats are: .jpg, .jpeg, .png, .webp`);
          }
          
          // Read file data to save to DB
          fileData = fs.readFileSync(filepath);
          filename = path.basename(filepath);
          mimeType = `image/${ext.substring(1).replace('jpg', 'jpeg')}`; // Simple MIME type inference
        } else {
          throw new Error('Either filepath or url must be provided');
        }
        
        // Default prompt if not provided
        const prompt = args.prompt || 'Describe this image';
        const modelName = args.modelname || 'gemini-2.5-flash';
        
        // Upload the file
        log.info('Uploading image file...');
        const file = await geminiService.uploadFile(filepath);
        
        // Process with Gemini
        log.info('Generating content from image...');
        const result = await geminiService.processFile(file, prompt, modelName);
        
        if (result.isError) {
          log.error(`Error in image recognition: ${result.text}`);
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
        
        // Save to MongoDB
        try {
          log.info('Saving image and analysis to MongoDB...');
          
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
          
          log.info('Image and analysis saved to MongoDB successfully');
        } catch (dbError) {
          log.error('Failed to save to MongoDB', dbError);
          // Don't fail the entire operation if DB save fails
        }
        
        log.info('Image recognition completed successfully');
        log.verbose('Image recognition result', JSON.stringify(result));
        
        return {
          content: [
            {
              type: 'text',
              text: result.text
            }
          ]
        };
      } catch (error) {
        log.error('Error in image recognition tool', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error processing image: ${errorMessage}`
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