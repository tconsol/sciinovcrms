const axios = require('axios');
const config = require('../config');

exports.signin = async (req, res) => {
  try {
    // Accept both userId and username for flexibility
    const userId = req.body.userId || req.body.username;
    const { password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and password are required' 
      });
    }

    // Validate config
    if (!config.sciinovBaseUrl) {
      console.error('[Auth] sciinov_BASE_URL not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: sciinov Base URL not set',
      });
    }

    console.log('[Auth] Signing in user:', userId);
    console.log('[Auth] Using sciinov URL:', config.sciinovBaseUrl);

    const response = await axios.post(`${config.sciinovBaseUrl}/api/auth/signin`, {
      userId,
      password,
    }, {
      timeout: 10000,
    });

    console.log('[Auth] Login successful for:', userId);
    console.log('[Auth] sciinov Response:', {
      hasToken: !!response.data.token,
      hasAccessToken: !!response.data.accessToken,
      hasJwt: !!response.data.jwt,
      keys: Object.keys(response.data),
      token: response.data.token ? response.data.token.substring(0, 50) + '...' : 'undefined',
    });
    
    // Map sciinov response to our standard format
    // sciinov uses 'token' instead of 'accessToken'
    const tokenValue = response.data.token || response.data.accessToken || response.data.jwt;
    
    const authResponse = {
      success: true,
      accessToken: tokenValue,
      refreshToken: response.data.refreshToken,
      userId: response.data.userId || response.data.id,
      username: response.data.username || userId,
      email: response.data.email,
      roles: response.data.roles || [],
    };

    console.log('[Auth] Sending response:', {
      hasAccessToken: !!authResponse.accessToken,
      keys: Object.keys(authResponse),
    });

    res.json(authResponse);
  } catch (error) {
    console.error('[Auth Error Details]', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      sciinoveBaseUrl: config.sciinovBaseUrl,
    });

    // Log full error for debugging
    console.error('[Auth Full Error]', error);

    // Determine specific error type
    let message = 'Authentication failed';
    const errorData = error.response?.data;
    const errorStatus = error.response?.status;
    const rawErrorMsg = errorData?.message || errorData?.error || '';
    const errorMsg = rawErrorMsg.toLowerCase();

    console.log('[Auth Error Analysis]', {
      status: errorStatus,
      rawErrorMsg,
      errorMsg,
      hasResponse: !!error.response,
    });

    // Priority 1: Check connection errors
    if (error.code === 'ECONNABORTED') {
      message = 'Request timeout. sciinov DBMS may be unreachable.';
    } 
    else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      message = 'Connection error. sciinov DBMS may be unreachable.';
    }
    // Priority 2: Check error message content first (most reliable for distinguishing)
    else if (
      errorMsg.includes('user') || 
      errorMsg.includes('not found') || 
      errorMsg.includes('doesn\'t exist') ||
      errorMsg.includes('no user') ||
      errorMsg.includes('invalid user')
    ) {
      message = 'Invalid user ID';
    }
    else if (
      errorMsg.includes('password') ||
      errorMsg.includes('incorrect') ||
      errorMsg.includes('wrong') ||
      errorMsg.includes('invalid password') ||
      errorMsg.includes('unauthorized')
    ) {
      message = 'Invalid password';
    }
    // Priority 3: Use status code as secondary indicator
    else if (errorStatus === 401) {
      // 401 without clear message - default to password error (more common)
      message = 'Invalid password';
    } 
    else if (errorStatus === 404) {
      // 404 = Not Found (user doesn't exist)
      message = 'Invalid user ID';
    } 
    else if (errorStatus === 400) {
      // 400 = Bad Request
      message = errorData?.message || 'Invalid credentials';
    }
    else if (errorStatus === 422 || errorStatus === 403) {
      // 422 = Unprocessable Entity, 403 = Forbidden
      message = 'Invalid password';
    }
    else {
      // Fallback to error message if available
      message = errorData?.message || errorData?.error || message;
    }
    
    const status = errorStatus || (error.code === 'ECONNABORTED' ? 504 : 500);
    
    console.log('[Auth Final Error Response]', { status, message });
    
    res.status(status).json({ 
      success: false,
      message,
      error: message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Refresh token is required' 
      });
    }

    console.log('[Auth] Refreshing token');

    const response = await axios.post(`${config.sciinovBaseUrl}/api/auth/refresh-token`, {
      refreshToken,
    }, {
      timeout: 10000,
    });

    const refreshResponse = {
      success: true,
      accessToken: response.data.token || response.data.accessToken || response.data.jwt,
      refreshToken: response.data.refreshToken,
    };

    console.log('[Auth] Token refreshed successfully');
    res.json(refreshResponse);
  } catch (error) {
    console.error('[Refresh Error]', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Token refresh failed';
    res.status(status).json({ 
      success: false,
      message 
    });
  }
};

exports.ssoLaunch = async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    if (!userId || !password) {
      return res.status(400).json({ message: 'Credentials required' });
    }

    // Re-auth against sciinov to get fresh token
    const sciRes = await axios.post(`${config.sciinovBaseUrl}/api/auth/signin`, { userId, password }, { timeout: 10000 });
    const token = sciRes.data.token || sciRes.data.accessToken || sciRes.data.jwt;
    if (!token) return res.status(500).json({ message: 'No token from sciinov' });

    const roles = sciRes.data.roles || [];
    const userData = JSON.stringify({
      id: sciRes.data.userId || sciRes.data.id || userId,
      username: sciRes.data.username || userId,
      email: sciRes.data.email || '',
      roles,
    });
    const refreshToken = sciRes.data.refreshToken || '';

    const redirectUrl = roles.includes('ROLE_SUPER_ADMIN')
      ? 'https://sciinovdbms.com/super-admin/dashboard'
      : 'https://sciinovdbms.com/admin/dashboard';

    // Pass token via URL — sciinovdbms.com frontend must read ?ssoToken and store to its own localStorage
    const ssoUrl = `${redirectUrl}?ssoToken=${encodeURIComponent(token)}&ssoUser=${encodeURIComponent(userData)}`;

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing in...</title></head><body>
<p style="font-family:sans-serif;padding:20px">Signing in to sciinov DBMS...</p>
<script>
window.location.replace(${JSON.stringify(ssoUrl)});
</script>
</body></html>`);
  } catch (error) {
    console.error('[SSO Launch Error]', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ message: 'SSO launch failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    console.log('[Auth] Logging out user:', req.user?.userId);

    // Send logout request to sciinov (optional - not all systems support it)
    try {
      await axios.post(
        `${config.sciinovBaseUrl}/api/auth/logout`,
        { refreshToken: req.body?.refreshToken || '' },
        { 
          headers: { Authorization: `Bearer ${req.user.token}` },
          timeout: 5000,
        }
      );
    } catch (sciinError) {
      console.warn('[Logout] sciinov logout failed (non-critical):', sciinError.message);
      // Don't throw - logout is still successful on our end
    }

    console.log('[Auth] User logged out successfully');
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('[Logout Error]', {
      message: error.message,
      status: error.response?.status,
    });

    // Logout should always succeed
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  }
};
