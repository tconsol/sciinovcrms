const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('[' + new Date().toISOString() + '] MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('[' + new Date().toISOString() + '] MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
