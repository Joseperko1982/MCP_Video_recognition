/**
 * MongoDB service for storing media and analysis results
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { createLogger } from '../utils/logger.js';

const log = createLogger('MongoDBService');

export interface MediaDocument {
  _id?: ObjectId;
  url: string;
  filename: string;
  mimeType: string;
  fileData: Buffer;
  fileSize: number;
  uploadedAt: Date;
  analysis?: {
    prompt: string;
    result: string;
    model: string;
    analyzedAt: Date;
  };
  metadata?: Record<string, any>;
}

export class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private mediaCollection: Collection<MediaDocument> | null = null;
  private connectionString: string;
  private dbName: string;

  constructor(connectionString: string, dbName: string = 'Joeexexassitant') {
    this.connectionString = connectionString;
    this.dbName = dbName;
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      log.info('Connecting to MongoDB...');
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      
      this.db = this.client.db(this.dbName);
      this.mediaCollection = this.db.collection<MediaDocument>('media');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      log.info('Successfully connected to MongoDB');
    } catch (error) {
      log.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  /**
   * Create indexes for the media collection
   */
  private async createIndexes(): Promise<void> {
    if (!this.mediaCollection) {
      throw new Error('Media collection not initialized');
    }

    try {
      // Index on URL for quick lookups
      await this.mediaCollection.createIndex({ url: 1 });
      
      // Index on uploadedAt for time-based queries
      await this.mediaCollection.createIndex({ uploadedAt: -1 });
      
      // Text index on analysis result for searching
      await this.mediaCollection.createIndex({ 'analysis.result': 'text' });
      
      log.info('Indexes created successfully');
    } catch (error) {
      log.error('Error creating indexes', error);
      // Don't throw - indexes are for optimization only
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.mediaCollection = null;
      log.info('Disconnected from MongoDB');
    }
  }

  /**
   * Save media and its analysis to MongoDB
   */
  async saveMedia(
    url: string,
    filename: string,
    mimeType: string,
    fileData: Buffer,
    analysis?: {
      prompt: string;
      result: string;
      model: string;
    }
  ): Promise<MediaDocument> {
    if (!this.mediaCollection) {
      throw new Error('MongoDB not connected');
    }

    const document: MediaDocument = {
      url,
      filename,
      mimeType,
      fileData,
      fileSize: fileData.length,
      uploadedAt: new Date(),
      ...(analysis && {
        analysis: {
          ...analysis,
          analyzedAt: new Date()
        }
      })
    };

    try {
      const result = await this.mediaCollection.insertOne(document);
      document._id = result.insertedId;
      
      log.info(`Media saved successfully: ${filename} (${fileData.length} bytes)`);
      return document;
    } catch (error) {
      log.error('Error saving media to MongoDB', error);
      throw error;
    }
  }

  /**
   * Update analysis for existing media
   */
  async updateAnalysis(
    mediaId: ObjectId | string,
    analysis: {
      prompt: string;
      result: string;
      model: string;
    }
  ): Promise<boolean> {
    if (!this.mediaCollection) {
      throw new Error('MongoDB not connected');
    }

    try {
      const id = typeof mediaId === 'string' ? new ObjectId(mediaId) : mediaId;
      
      const result = await this.mediaCollection.updateOne(
        { _id: id },
        {
          $set: {
            analysis: {
              ...analysis,
              analyzedAt: new Date()
            }
          }
        }
      );

      if (result.modifiedCount > 0) {
        log.info(`Analysis updated for media: ${id}`);
        return true;
      } else {
        log.warn(`No media found with ID: ${id}`);
        return false;
      }
    } catch (error) {
      log.error('Error updating analysis', error);
      throw error;
    }
  }

  /**
   * Find media by URL
   */
  async findByUrl(url: string): Promise<MediaDocument | null> {
    if (!this.mediaCollection) {
      throw new Error('MongoDB not connected');
    }

    try {
      const document = await this.mediaCollection.findOne({ url });
      if (document) {
        log.info(`Found existing media for URL: ${url}`);
      }
      return document;
    } catch (error) {
      log.error('Error finding media by URL', error);
      throw error;
    }
  }

  /**
   * Get recent media documents
   */
  async getRecentMedia(limit: number = 10): Promise<MediaDocument[]> {
    if (!this.mediaCollection) {
      throw new Error('MongoDB not connected');
    }

    try {
      const documents = await this.mediaCollection
        .find({})
        .sort({ uploadedAt: -1 })
        .limit(limit)
        .toArray();
      
      return documents;
    } catch (error) {
      log.error('Error getting recent media', error);
      throw error;
    }
  }

  /**
   * Search media by analysis content
   */
  async searchByAnalysis(searchText: string): Promise<MediaDocument[]> {
    if (!this.mediaCollection) {
      throw new Error('MongoDB not connected');
    }

    try {
      const documents = await this.mediaCollection
        .find({
          $text: { $search: searchText }
        })
        .toArray();
      
      log.info(`Found ${documents.length} documents matching: ${searchText}`);
      return documents;
    } catch (error) {
      log.error('Error searching media', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    averageSize: number;
  }> {
    if (!this.mediaCollection) {
      throw new Error('MongoDB not connected');
    }

    try {
      const stats = await this.mediaCollection.aggregate([
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
            averageSize: { $avg: '$fileSize' }
          }
        }
      ]).toArray();

      if (stats.length === 0) {
        return {
          totalDocuments: 0,
          totalSize: 0,
          averageSize: 0
        };
      }

      return {
        totalDocuments: stats[0].totalDocuments,
        totalSize: stats[0].totalSize,
        averageSize: Math.round(stats[0].averageSize)
      };
    } catch (error) {
      log.error('Error getting database statistics', error);
      throw error;
    }
  }
}