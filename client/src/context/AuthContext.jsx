import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const credentialsRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userId, password) => {
    try {
      const { data } = await api.post('/auth/signin', { userId, password });

      const token = data.accessToken || data.token || data.jwt;
      if (!token) throw new Error(`No token in response. Got: ${JSON.stringify(Object.keys(data))}`);

      const userData = {
        id: data.userId || data.id,
        username: data.username || userId,
        email: data.email,
        roles: data.roles || [],
      };

      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', data.refreshToken || '');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('ssoCredentials', JSON.stringify({ userId, password }));
      credentialsRef.current = { userId, password };
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('ssoCredentials');
      credentialsRef.current = null;
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, credentialsRef }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
