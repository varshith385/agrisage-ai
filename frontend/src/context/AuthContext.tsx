import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DemoFarmSummary, Farm } from '../types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeFarm: DemoFarmSummary | Farm | null;
  activeCrop: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (token: string, user: User, farm?: DemoFarmSummary | Farm | null, activeCrop?: string | null) => void;
  setActiveFarm: (farm: DemoFarmSummary | Farm | null) => void;
  setActiveCrop: (crop: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeFarm, setActiveFarm] = useState<DemoFarmSummary | Farm | null>(null);
  const [activeCrop, setActiveCrop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Rehydrate session from localStorage
    try {
      const storedToken = localStorage.getItem('agrisage_token');
      const storedUser = localStorage.getItem('agrisage_user');
      const storedFarm = localStorage.getItem('agrisage_active_farm');
      const storedCrop = localStorage.getItem('agrisage_active_crop');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedFarm) setActiveFarm(JSON.parse(storedFarm));
        if (storedCrop) setActiveCrop(storedCrop);
      }
    } catch {
      localStorage.removeItem('agrisage_token');
      localStorage.removeItem('agrisage_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = (
    newToken: string,
    newUser: User,
    newFarm?: DemoFarmSummary | Farm | null,
    newCrop?: string | null
  ) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('agrisage_token', newToken);
    localStorage.setItem('agrisage_user', JSON.stringify(newUser));

    if (newFarm) {
      setActiveFarm(newFarm);
      localStorage.setItem('agrisage_active_farm', JSON.stringify(newFarm));
    }
    if (newCrop) {
      setActiveCrop(newCrop);
      localStorage.setItem('agrisage_active_crop', newCrop);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActiveFarm(null);
    setActiveCrop(null);
    localStorage.removeItem('agrisage_token');
    localStorage.removeItem('agrisage_user');
    localStorage.removeItem('agrisage_active_farm');
    localStorage.removeItem('agrisage_active_crop');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeFarm,
        activeCrop,
        isAuthenticated: !!token && !!user,
        isLoading,
        setSession,
        setActiveFarm,
        setActiveCrop,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

