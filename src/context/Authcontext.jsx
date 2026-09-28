import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('pillsync_token');
      const storedUser = localStorage.getItem('pillsync_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load authentication:', error);
      localStorage.removeItem('pillsync_token');
      localStorage.removeItem('pillsync_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      // Temporary frontend login
      const loggedUser = {
        id: 'usr_1',
        name: 'John Doe',
        email,
        role: 'patient',
      };

      const fakeToken = 'pillsync-demo-token';

      localStorage.setItem('pillsync_token', fakeToken);
      localStorage.setItem(
        'pillsync_user',
        JSON.stringify(loggedUser)
      );

      setToken(fakeToken);
      setUser(loggedUser);

      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);

    try {
      const newUser = {
        id: Date.now().toString(),
        ...userData,
      };

      const fakeToken = 'pillsync-demo-token';

      localStorage.setItem('pillsync_token', fakeToken);
      localStorage.setItem(
        'pillsync_user',
        JSON.stringify(newUser)
      );

      setToken(fakeToken);
      setUser(newUser);

      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pillsync_token');
    localStorage.removeItem('pillsync_user');

    setUser(null);
    setToken(null);
  };

  const updateUserProfile = (profileData) => {
    setUser((previousUser) => {
      if (!previousUser) return null;

      const updatedUser = {
        ...previousUser,
        ...profileData,
      };

      localStorage.setItem(
        'pillsync_user',
        JSON.stringify(updatedUser)
      );

      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
