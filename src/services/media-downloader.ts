/**
 * Media downloader service for fetching images and videos from URLs
 */

import axios from 'axios';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import mime from 'mime-types';
import { createLogger } from '../utils/logger.js';

const log = createLogger('MediaDownloaderService');

export interface DownloadResult {
  filepath: string;
  filename: string;
  mimeType: string;
  fileData: Buffer;
  fileSize: number;
}

export class MediaDownloaderService {
  private tempDir: string;
  private maxFileSize: number;
  private supportedMimeTypes: Set<string>;

  constructor(maxFileSize: number = 100 * 1024 * 1024) { // Default 100MB
    this.maxFileSize = maxFileSize;
    this.tempDir = path.join(os.tmpdir(), 'mcp-video-recognition');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Supported MIME types
    this.supportedMimeTypes = new Set([
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      // Videos
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/ogg'
    ]);
  }

  /**
   * Download media from URL
   */
  async downloadMedia(url: string): Promise<DownloadResult> {
    try {
      log.info(`Starting download from URL: ${url}`);

      return await this.downloadWithRetry(url);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Download failed with status ${error.response.status}: ${error.response.statusText}`);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Download timeout');
        } else {
          throw new Error(`Network error: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Get appropriate header strategies based on URL
   */
  private getStrategiesForUrl(url: string): Record<string, string>[] {
    const isFacebookUrl = url.includes('fbcdn.net') || url.includes('facebook.com');
    const isInstagramUrl = url.includes('cdninstagram.com') || url.includes('instagram.com');
    const isTwitterUrl = url.includes('twimg.com') || url.includes('twitter.com') || url.includes('x.com');

    if (isFacebookUrl) {
      return [
        // Facebook-specific strategy
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.facebook.com/',
          'Origin': 'https://www.facebook.com',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'video',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site'
        },
        // Fallback Chrome strategy
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.facebook.com/'
        }
      ];
    }

    if (isInstagramUrl) {
      return [
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.instagram.com/',
          'Origin': 'https://www.instagram.com'
        }
      ];
    }

    // Default strategies for other URLs
    return [
      // Strategy 1: Chrome-like headers
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      // Strategy 2: Firefox-like headers
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      // Strategy 3: Simple bot-friendly headers
      {
        'User-Agent': 'MCP-Video-Recognition/1.0 (+https://github.com/mario-andreschak/mcp_video_recognition)',
        'Accept': '*/*'
      }
    ];
  }

  /**
   * Download with retry logic and different header strategies
   */
  private async downloadWithRetry(url: string): Promise<DownloadResult> {
    const strategies = this.getStrategiesForUrl(url);

    let lastError: Error | null = null;

    for (let i = 0; i < strategies.length; i++) {
      try {
        const headers = strategies[i];
        log.info(`Trying download strategy ${i + 1}/${strategies.length}`);

        // Try HEAD request first to check content type and size (optional)
        let contentType: string | undefined;
        let contentLength = 0;
        
        try {
          const headResponse = await axios.head(url, {
            timeout: 10000,
            maxRedirects: 5,
            headers
          });
          contentType = headResponse.headers['content-type'];
          contentLength = parseInt(headResponse.headers['content-length'] || '0');
        } catch (headError) {
          log.warn('HEAD request failed, proceeding with GET request');
        }

        // Download the file
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 60000, // Increased timeout
          maxRedirects: 5,
          maxContentLength: this.maxFileSize,
          headers
        });

        // Get content type from response if HEAD request failed
        if (!contentType) {
          contentType = response.headers['content-type'];
        }

        // Validate content type
        if (contentType && !this.isSupported(contentType)) {
          throw new Error(`Unsupported media type: ${contentType}`);
        }

        const fileData = Buffer.from(response.data);
        
        // Check file size
        if (fileData.length > this.maxFileSize) {
          throw new Error(`File too large: ${fileData.length} bytes (max: ${this.maxFileSize} bytes)`);
        }

        // Generate filename from URL or use random name
        const filename = this.generateFilename(url, contentType || 'application/octet-stream');
        const filepath = path.join(this.tempDir, filename);

        // Save to temp file
        fs.writeFileSync(filepath, fileData);

        log.info(`Downloaded successfully: ${filename} (${fileData.length} bytes)`);

        return {
          filepath,
          filename,
          mimeType: contentType || 'application/octet-stream',
          fileData,
          fileSize: fileData.length
        };
      } catch (error) {
        lastError = error as Error;
        log.warn(`Strategy ${i + 1} failed: ${lastError.message}`);
        
        // If this is a 403/401/429, try next strategy
        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;
          if (status === 403 || status === 401 || status === 429) {
            continue;
          }
        }
        
        // For other errors, break and throw
        throw error;
      }
    }

    // If all strategies failed
    throw lastError || new Error('All download strategies failed');
  }

  /**
   * Download media and return as buffer (without saving to disk)
   */
  async downloadMediaBuffer(url: string): Promise<DownloadResult> {
    try {
      log.info(`Starting buffer download from URL: ${url}`);

      // Use the same retry strategy but don't save to disk
      const result = await this.downloadWithRetry(url);
      
      // Remove the temp file since we only want the buffer
      this.cleanupTempFile(result.filepath);
      
      return {
        filepath: '', // No file path for buffer-only download
        filename: result.filename,
        mimeType: result.mimeType,
        fileData: result.fileData,
        fileSize: result.fileSize
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Download failed with status ${error.response.status}: ${error.response.statusText}`);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Download timeout');
        } else {
          throw new Error(`Network error: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Check if MIME type is supported
   */
  isSupported(mimeType: string): boolean {
    if (!mimeType) return false;
    
    // Extract base MIME type (without parameters)
    const baseMimeType = mimeType.split(';')[0].trim().toLowerCase();
    
    return this.supportedMimeTypes.has(baseMimeType);
  }

  /**
   * Test URL accessibility without downloading
   */
  async testUrl(url: string): Promise<{
    accessible: boolean;
    status?: number;
    contentType?: string;
    contentLength?: number;
    error?: string;
    strategy?: number;
  }> {
    const strategies = [
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      {
        'User-Agent': 'MCP-Video-Recognition/1.0 (+https://github.com/mario-andreschak/mcp_video_recognition)',
        'Accept': '*/*'
      }
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const response = await axios.head(url, {
          timeout: 10000,
          maxRedirects: 5,
          headers: strategies[i]
        });

        return {
          accessible: true,
          status: response.status,
          contentType: response.headers['content-type'],
          contentLength: parseInt(response.headers['content-length'] || '0'),
          strategy: i + 1
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;
          if (status === 403 || status === 401 || status === 429) {
            // Try next strategy
            continue;
          }
          // For other HTTP errors, return immediately
          return {
            accessible: false,
            status: error.response.status,
            error: `HTTP ${error.response.status}: ${error.response.statusText}`,
            strategy: i + 1
          };
        }
      }
    }

    return {
      accessible: false,
      error: 'All strategies failed',
      strategy: strategies.length
    };
  }

  /**
   * Generate filename from URL or use random name
   */
  private generateFilename(url: string, mimeType: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const basename = path.basename(pathname);
      
      // If basename has an extension, use it
      if (basename && basename.includes('.')) {
        return basename;
      }
      
      // Otherwise, generate a name with appropriate extension
      const extension = mime.extension(mimeType) || 'bin';
      const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
      return `media_${hash}.${extension}`;
    } catch {
      // If URL parsing fails, just use a random name
      const extension = mime.extension(mimeType) || 'bin';
      const randomId = crypto.randomBytes(4).toString('hex');
      return `media_${randomId}.${extension}`;
    }
  }

  /**
   * Clean up temporary files
   */
  cleanupTempFile(filepath: string): void {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        log.info(`Cleaned up temp file: ${filepath}`);
      }
    } catch (error) {
      log.error(`Error cleaning up temp file: ${filepath}`, error);
    }
  }

  /**
   * Clean up all temporary files
   */
  cleanupAllTempFiles(): void {
    try {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        const filepath = path.join(this.tempDir, file);
        fs.unlinkSync(filepath);
      });
      log.info(`Cleaned up ${files.length} temp files`);
    } catch (error) {
      log.error('Error cleaning up temp files', error);
    }
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    
    this.supportedMimeTypes.forEach(mimeType => {
      const ext = mime.extension(mimeType);
      if (ext) {
        extensions.add(`.${ext}`);
      }
    });

    return Array.from(extensions).sort();
  }
}