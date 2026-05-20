const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Conferences
router.get('/conferences', adminController.getConferences);
router.post('/conferences', adminController.createConference);
router.put('/conferences/:id', adminController.updateConference);
router.delete('/conferences/:id', adminController.deleteConference);

// Roles
router.get('/roles', adminController.getRoles);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);

// Statuses
router.get('/statuses', adminController.getStatuses);
router.post('/statuses', adminController.createStatus);
router.put('/statuses/:id', adminController.updateStatus);
router.delete('/statuses/:id', adminController.deleteStatus);

// Payment Modes
router.get('/payment-modes', adminController.getPaymentModes);
router.post('/payment-modes', adminController.createPaymentMode);
router.put('/payment-modes/:id', adminController.updatePaymentMode);
router.delete('/payment-modes/:id', adminController.deletePaymentMode);

module.exports = router;
