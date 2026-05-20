const router = require('express').Router();
const { body } = require('express-validator');
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../utils/upload');

const clientValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').trim().notEmpty().withMessage('Role is required'),
];

router.use(authMiddleware);

router.post('/', upload.single('profileImage'), clientValidation, validate, clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.put('/:id', upload.single('profileImage'), clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
