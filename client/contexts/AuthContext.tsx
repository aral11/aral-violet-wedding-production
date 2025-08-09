import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  user: { name: string; role: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('wedding_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUser(authData.user);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Simple authentication - in production, this would be done on the server
    const validCredentials = [
      { username: 'aral', password: 'aral2025', name: 'Aral', role: 'admin' },
      { username: 'violet', password: 'violet2025', name: 'Violet', role: 'admin' },
      { username: 'couple', password: 'wedding2025', name: 'Aral & Violet', role: 'admin' }
    ];

    const validUser = validCredentials.find(
      cred => cred.username === username.toLowerCase() && cred.password === password
    );

    if (validUser) {
      const userData = { name: validUser.name, role: validUser.role };
      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem('wedding_auth', JSON.stringify({ user: userData }));
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('wedding_auth');
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
