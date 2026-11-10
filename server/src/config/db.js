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
      
      // If development or test, start MongoMemoryServer fallback
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Initializing in-memory MongoDB fallback server...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const conn = await mongoose.connect(memoryUri);
        logger.info(`MongoDB Connected to in-memory database: ${memoryUri}`);
        return conn;
      } else {
        throw directErr;
      }
    }
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
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
