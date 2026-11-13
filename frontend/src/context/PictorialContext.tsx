import React, { createContext, useContext, useState, useEffect } from 'react';

interface PictorialContextType {
  isPictorial: boolean;
  setPictorial: (val: boolean) => void;
  togglePictorial: () => void;
}

const PictorialContext = createContext<PictorialContextType | undefined>(undefined);

const PICTORIAL_STORAGE_KEY = 'agrisage_pictorial_mode';

export const PictorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPictorial, setIsPictorialState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(PICTORIAL_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const setPictorial = (val: boolean) => {
    setIsPictorialState(val);
    try {
      localStorage.setItem(PICTORIAL_STORAGE_KEY, String(val));
    } catch {
      // storage unavailable
    }
  };

  const togglePictorial = () => {
    setPictorial(!isPictorial);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isPictorial) {
      root.classList.add('mode-pictorial');
    } else {
      root.classList.remove('mode-pictorial');
    }
  }, [isPictorial]);

  return (
    <PictorialContext.Provider value={{ isPictorial, setPictorial, togglePictorial }}>
      {children}
    </PictorialContext.Provider>
  );
};

export const usePictorial = (): PictorialContextType => {
  const context = useContext(PictorialContext);
  if (!context) {
    throw new Error('usePictorial must be used within a PictorialProvider');
  }
  return context;
};
