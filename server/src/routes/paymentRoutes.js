const router = require('express').Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const paymentValidation = [
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('amountPaid').isNumeric().withMessage('Amount must be a number'),
  body('actualFee').isNumeric().withMessage('Actual fee must be a number'),
  body('paymentMode').isIn(['UPI', 'CARD', 'BANK']).withMessage('Invalid payment mode'),
];

router.use(authMiddleware);

router.post('/', paymentValidation, validate, paymentController.addPayment);
router.get('/', paymentController.getAllPayments);
router.get('/client/:clientId', paymentController.getPaymentsByClient);
router.put('/:id', paymentController.updatePayment);

module.exports = router;
