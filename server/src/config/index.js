require('dotenv').config();

module.exports = {
  // Cloud Run injects PORT env var - prioritize it over .env
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sciinovcrms',
  sciinovBaseUrl: process.env.SCIINOV_BASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  nodeEnv: process.env.NODE_ENV || 'development',
};
