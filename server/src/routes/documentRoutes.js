const router = require('express').Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/acceptance-letter', documentController.generateAcceptanceLetter);

module.exports = router;
