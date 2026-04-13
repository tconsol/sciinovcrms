const router = require('express').Router();
const { body } = require('express-validator');
const followUpController = require('../controllers/followUpController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const followUpValidation = [
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('followUpDate').isISO8601().withMessage('Valid follow-up date is required'),
];

router.use(authMiddleware);

router.post('/', followUpValidation, validate, followUpController.createFollowUp);
router.get('/', followUpController.getAllFollowUps);
router.get('/client/:clientId', followUpController.getFollowUpsByClient);
router.put('/:id', followUpController.updateFollowUp);
router.delete('/:id', followUpController.deleteFollowUp);

module.exports = router;
