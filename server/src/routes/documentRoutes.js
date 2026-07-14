const router = require('express').Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);
router.use(roleMiddleware('ROLE_SUPER_ADMIN', 'ROLE_ADMIN'));

router.get('/types', documentController.getDocTypes);
router.get('/', documentController.listDocuments);
router.post('/', documentController.createDocument);
router.get('/:id', documentController.getDocument);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);
router.get('/:id/download', documentController.downloadDocument);

module.exports = router;
