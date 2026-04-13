const router = require('express').Router();
const activityLogController = require('../controllers/activityLogController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', activityLogController.getActivityLogs);

module.exports = router;
