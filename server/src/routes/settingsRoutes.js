const router = require('express').Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const uploadMemory = require('../utils/uploadMemory');

router.use(authMiddleware);

router.get('/logo', settingsController.getLogo);
router.post('/logo', roleMiddleware('ROLE_SUPER_ADMIN'), uploadMemory.single('logo'), settingsController.uploadLogo);

module.exports = router;
