const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', dashboardController.getDashboard);
router.get('/analytics', dashboardController.getAnalytics);

module.exports = router;
