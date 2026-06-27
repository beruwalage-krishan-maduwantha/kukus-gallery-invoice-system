import { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('user') && !!localStorage.getItem('token');
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMeApi()
        .then(res => {
          if (res.data && res.data._id) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
