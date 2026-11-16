import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let mongod = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker';
    
    // Attempt standard connection
    try {
      mongoose.set('strictQuery', false);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500, // Quick timeout to fallback if local mongo is absent
      });
      logger.info(`MongoDB Connected successfully to: ${conn.connection.host}`);
      return conn;
    } catch (directErr) {
      logger.warn(`Could not connect to external MongoDB (${directErr.message}).`);
      
      // If development, test, or explicitly allowed fallback, attempt MongoMemoryServer
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MEMORY_DB === 'true' || !process.env.MONGO_URI) {
        try {
          logger.info('Initializing in-memory MongoDB fallback server...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongod = await MongoMemoryServer.create();
          const memoryUri = mongod.getUri();
          const conn = await mongoose.connect(memoryUri);
          logger.info(`MongoDB Connected to in-memory database: ${memoryUri}`);
          return conn;
        } catch (memErr) {
          logger.warn(`In-memory database unavailable on this OS (${memErr.message}).`);
          logger.warn('Please provide a valid MONGO_URI (e.g. from MongoDB Atlas) for cloud deployment.');
          return null;
        }
      } else {
        throw directErr;
      }
    }
  } catch (error) {
    logger.error(`Database connection warning: ${error.message}`);
    if (process.env.STRICT_DB_EXIT === 'true') {
      process.exit(1);
    }
    return null;
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    logger.info('MongoDB connection closed.');
  } catch (error) {
    logger.error(`Error closing MongoDB: ${error.message}`);
  }
};
