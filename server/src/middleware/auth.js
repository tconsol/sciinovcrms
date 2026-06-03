const axios = require('axios');
const config = require('../config');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Validate token by calling sciinov API
      await axios.get(`${config.sciinovBaseUrl}/api/conferences`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
    } catch (validateError) {
      console.warn('[Auth Validation]', {
        status: validateError.response?.status,
        message: validateError.message,
      });

      if (validateError.response?.status === 401) {
        return res.status(401).json({ message: 'Token expired or invalid.' });
      }
      // If sciinov is unreachable, still proceed with token decode
    }

    // Decode JWT payload (without verification)
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      req.user = {
        userId: payload.id || payload.userId || payload.sub || 'unknown',
        roles: payload.roles || [],
        email: payload.email || payload.sub || '',
        token,
      };
    } catch (decodeError) {
      console.error('[Token Decode Error]', decodeError.message);
      return res.status(401).json({ message: 'Invalid token format.' });
    }

    next();
  } catch (error) {
    console.error('[Middleware Auth Error]', error.message);
    return res.status(401).json({ message: 'Authentication failed.' });
  }
};

module.exports = authMiddleware;
