const router = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const config = require('../config');
const axios = require('axios');

router.post('/signin', authController.signin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

// Test endpoint - check SciInov connection
router.get('/test', async (req, res) => {
  try {
    console.log('[Test] Checking SciInov connection to:', config.sciinovBaseUrl);
    const response = await axios.get(`${config.sciinovBaseUrl}/api/health`, {
      timeout: 5000,
    }).catch(() => {
      // SciInov might not have /health, try /conferences
      return axios.get(`${config.sciinovBaseUrl}/api/conferences`, {
        headers: { Authorization: 'Bearer test' },
        timeout: 5000,
      }).catch(err => ({ data: { status: 'error', error: err.message } }));
    });

    res.json({
      sciinov: config.sciinovBaseUrl,
      connected: response.status < 500,
      response: response.data || response.statusText,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      sciinov: config.sciinovBaseUrl,
    });
  }
});

module.exports = router;
