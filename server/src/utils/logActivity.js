const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ userId, actionType, description, clientId, metadata }) => {
  try {
    await ActivityLog.create({ userId, actionType, description, clientId, metadata });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = logActivity;
