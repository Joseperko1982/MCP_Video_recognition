/**
 * Entry point for the MCP video recognition server
 */

import 'dotenv/config';
import { Server } from './server.js';
import { createLogger, LogLevel, Logger } from './utils/logger.js';
import type { ServerConfig } from './server.js';

const log = createLogger('Main');

// Set log level from environment variable
const logLevel = ( process.env.LOG_LEVEL || LogLevel.FATAL ) as LogLevel;
Logger.setLogLevel(logLevel as LogLevel);

/**
 * Load configuration from environment variables
 */
function loadConfig(): ServerConfig {
  // Log environment for debugging (without sensitive data)
  log.info('Environment check:', {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    TRANSPORT_TYPE: process.env.TRANSPORT_TYPE || 'not set',
    PORT: process.env.PORT || 'not set',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'default',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '[SET]' : '[NOT SET]',
    MONGODB_URI: process.env.MONGODB_URI ? '[SET]' : '[NOT SET]'
  });

  // Check for required environment variables
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    log.error('GOOGLE_API_KEY environment variable is missing');
    log.error('Please set it in Supermachine dashboard or .env file');
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }

  // Determine transport type
  const transportType = process.env.TRANSPORT_TYPE === 'sse' ? 'sse' : 'stdio';
  
  // Parse port if provided (important for cloud deployments)
  const portStr = process.env.PORT;
  const port = portStr ? parseInt(portStr, 10) : 3000;
  
  // MongoDB configuration
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    log.error('MONGODB_URI environment variable is missing');
    log.error('Please set it in Supermachine dashboard or .env file');
    log.error('Format: mongodb+srv://username:password@cluster.mongodb.net/');
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  // Validate MongoDB URI format
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    log.error('Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
    throw new Error('Invalid MONGODB_URI format');
  }
  
  return {
    gemini: {
      apiKey
    },
    transport: transportType,
    port,
    mongodb: {
      uri: mongoUri,
      dbName: process.env.MONGODB_DB_NAME || 'video_analysis'
    }
  };
}

/**
 * Main function to start the server
 */
async function main(): Promise<void> {
  try {
    log.info('Starting MCP video recognition server');
    
    // Load configuration
    const config = loadConfig();
    log.info(`Using transport: ${config.transport}`);
    
    // Create and start server
    const server = new Server(config);
    await server.start();
    
    // Handle process termination
    process.on('SIGINT', async () => {
      log.info('Received SIGINT signal, shutting down...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      log.info('Received SIGTERM signal, shutting down...');
      await server.stop();
      process.exit(0);
    });
    
    log.info('Server started successfully');
  } catch (error) {
    log.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
