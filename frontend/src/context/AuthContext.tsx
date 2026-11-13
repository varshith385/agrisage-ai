import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, DemoFarmSummary, Farm } from '../types/api';
import { farmsApi } from '../api/farms';

export interface UserLocation {
  state: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  activeFarmId: number | null;
  activeFarm: Farm | null;
  farms: Farm[];
  isLoadingFarms: boolean;
  location: UserLocation | null;
  activeCrop: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (
    token: string,
    user: User,
    farm?: DemoFarmSummary | Farm | null,
    activeCrop?: string | null
  ) => void;
  setActiveFarmId: (id: number | null) => void;
  setActiveFarm: (farm: DemoFarmSummary | Farm | null) => void;
  setLocation: (loc: UserLocation | null) => void;
  setActiveCrop: (crop: string | null) => void;
  refreshFarms: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('agrisage_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('agrisage_token');
    } catch {
      return null;
    }
  });

  const [activeFarmId, setActiveFarmIdState] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('agrisage_active_farm_id');
      if (stored) {
        const num = Number(stored);
        return isNaN(num) ? null : num;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [location, setLocationState] = useState<UserLocation | null>(() => {
    try {
      const stored = localStorage.getItem('agrisage_location');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeCrop, setActiveCropState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('agrisage_active_crop');
    } catch {
      return null;
    }
  });

  const isLoading = false;

  // TanStack Query: Fetch all farms for the authenticated user
  const {
    data: farms = [],
    isLoading: isLoadingFarms,
    refetch: refetchFarms,
  } = useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: farmsApi.getFarms,
    enabled: !!token,
    staleTime: 30000,
  });

  // TanStack Query: Fetch active farm details
  const { data: activeFarmData } = useQuery<Farm | null>({
    queryKey: ['farm', activeFarmId],
    queryFn: () => (activeFarmId ? farmsApi.getFarmById(activeFarmId) : null),
    enabled: !!token && activeFarmId !== null,
    staleTime: 30000,
  });

  // Reconcile active farm object
  const activeFarm: Farm | null = useMemo(() => {
    if (activeFarmData) return activeFarmData;
    if (activeFarmId !== null && farms.length > 0) {
      const found = farms.find((f) => f.id === activeFarmId);
      if (found) return found;
    }
    if (activeFarmId === null && farms.length > 0) {
      return farms[0];
    }
    return null;
  }, [activeFarmData, activeFarmId, farms]);

  // Synchronize activeFarmId with fetched holdings
  useEffect(() => {
    if (farms.length > 0) {
      if (activeFarmId === null || !farms.some((f) => f.id === activeFarmId)) {
        const defaultId = farms[0].id;
        setActiveFarmIdState(defaultId);
        try {
          localStorage.setItem('agrisage_active_farm_id', String(defaultId));
        } catch {
          // ignore
        }
      }
    } else if (!isLoadingFarms && farms.length === 0) {
      if (activeFarmId !== null) {
        setActiveFarmIdState(null);
        try {
          localStorage.removeItem('agrisage_active_farm_id');
        } catch {
          // ignore
        }
      }
    }
  }, [farms, activeFarmId, isLoadingFarms]);

  // Synchronize location and active crop when active farm details update
  useEffect(() => {
    if (activeFarm) {
      const farmLoc: UserLocation = {
        state: activeFarm.state,
        district: activeFarm.district,
        village: activeFarm.village,
        latitude: activeFarm.latitude,
        longitude: activeFarm.longitude,
      };
      setLocationState(farmLoc);
      try {
        localStorage.setItem('agrisage_location', JSON.stringify(farmLoc));
        localStorage.setItem('agrisage_active_farm', JSON.stringify(activeFarm));
      } catch {
        // ignore
      }

      const activeCycle = activeFarm.current_crop_cycles?.find((c) => c.is_active);
      if (activeCycle) {
        setActiveCropState(activeCycle.crop_name);
        try {
          localStorage.setItem('agrisage_active_crop', activeCycle.crop_name);
        } catch {
          // ignore
        }
      }
    }
  }, [activeFarm]);

  const setActiveFarmId = useCallback(
    (id: number | null) => {
      setActiveFarmIdState(id);
      try {
        if (id !== null) {
          localStorage.setItem('agrisage_active_farm_id', String(id));
        } else {
          localStorage.removeItem('agrisage_active_farm_id');
        }
      } catch {
        // ignore
      }
      if (id !== null) {
        queryClient.invalidateQueries({ queryKey: ['farm', id] });
      }
    },
    [queryClient]
  );

  const setActiveFarm = useCallback(
    (farm: DemoFarmSummary | Farm | null) => {
      if (farm && farm.id) {
        setActiveFarmId(farm.id);
      } else {
        setActiveFarmId(null);
      }
    },
    [setActiveFarmId]
  );

  const setLocation = useCallback((loc: UserLocation | null) => {
    setLocationState(loc);
    try {
      if (loc) {
        localStorage.setItem('agrisage_location', JSON.stringify(loc));
      } else {
        localStorage.removeItem('agrisage_location');
      }
    } catch {
      // ignore
    }
  }, []);

  const setActiveCrop = useCallback((crop: string | null) => {
    setActiveCropState(crop);
    try {
      if (crop) {
        localStorage.setItem('agrisage_active_crop', crop);
      } else {
        localStorage.removeItem('agrisage_active_crop');
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshFarms = useCallback(async () => {
    await refetchFarms();
  }, [refetchFarms]);

  const setSession = (
    newToken: string,
    newUser: User,
    newFarm?: DemoFarmSummary | Farm | null,
    newCrop?: string | null
  ) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem('agrisage_token', newToken);
      localStorage.setItem('agrisage_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }

    if (newFarm && newFarm.id) {
      setActiveFarmId(newFarm.id);
    }
    if (newCrop) {
      setActiveCrop(newCrop);
    }
    queryClient.invalidateQueries({ queryKey: ['farms'] });
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setActiveFarmIdState(null);
    setLocationState(null);
    setActiveCropState(null);
    try {
      localStorage.removeItem('agrisage_token');
      localStorage.removeItem('agrisage_user');
      localStorage.removeItem('agrisage_active_farm_id');
      localStorage.removeItem('agrisage_active_farm');
      localStorage.removeItem('agrisage_location');
      localStorage.removeItem('agrisage_active_crop');
    } catch {
      // ignore
    }
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeFarmId,
        activeFarm,
        farms,
        isLoadingFarms,
        location,
        activeCrop,
        isAuthenticated: !!token && !!user,
        isLoading,
        setSession,
        setActiveFarmId,
        setActiveFarm,
        setLocation,
        setActiveCrop,
        refreshFarms,
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
