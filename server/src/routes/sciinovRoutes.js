const router = require('express').Router();
const sciinovController = require('../controllers/sciinovController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/conferences', sciinovController.getConferences);
router.get('/dashboard-data', sciinovController.getDashboardData);
router.get('/export/excel', sciinovController.exportExcel);
router.get('/export/pdf', sciinovController.exportPdf);

module.exports = router;
