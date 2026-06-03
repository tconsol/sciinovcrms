const ActivityLog = require('../models/ActivityLog');

exports.deleteActivityLogs = async (req, res) => {
  try {
    const { ids, all } = req.body;
    if (all) {
      const result = await ActivityLog.deleteMany({});
      return res.json({ deleted: result.deletedCount, message: 'All activity logs deleted' });
    }
    if (!ids?.length) return res.status(400).json({ message: 'ids array required' });
    const result = await ActivityLog.deleteMany({ _id: { $in: ids } });
    res.json({ deleted: result.deletedCount, message: `${result.deletedCount} log(s) deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, clientId, actionType, userId } = req.query;

    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (actionType) filter.actionType = actionType;
    // If userId is provided (admin filtering), only show logs from that user
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('clientId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
