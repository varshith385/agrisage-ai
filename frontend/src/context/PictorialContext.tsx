import React, { createContext, useContext, useState, useEffect } from 'react';

interface PictorialContextType {
  isPictorial: boolean;
  mode: 'pictures' | 'words';
  setPictorial: (val: boolean) => void;
  setMode: (mode: 'pictures' | 'words') => void;
  togglePictorial: () => void;
}

const PictorialContext = createContext<PictorialContextType | undefined>(undefined);

export const PICTORIAL_STORAGE_KEY = 'agrisage_pictorial_mode';

export const PictorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPictorial, setIsPictorialState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(PICTORIAL_STORAGE_KEY);
      if (stored === null) {
        // Default for brand-new visitor is Pictures
        return true;
      }
      return stored === 'true' || stored === 'pictures';
    } catch {
      return true;
    }
  });

  const setPictorial = (val: boolean) => {
    setIsPictorialState(val);
    try {
      localStorage.setItem(PICTORIAL_STORAGE_KEY, val ? 'pictures' : 'words');
    } catch {
      // storage unavailable
    }
  };

  const setMode = (mode: 'pictures' | 'words') => {
    setPictorial(mode === 'pictures');
  };

  const togglePictorial = () => {
    setPictorial(!isPictorial);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isPictorial) {
      root.classList.add('mode-pictorial');
      root.classList.remove('mode-words');
    } else {
      root.classList.add('mode-words');
      root.classList.remove('mode-pictorial');
    }
  }, [isPictorial]);

  return (
    <PictorialContext.Provider
      value={{
        isPictorial,
        mode: isPictorial ? 'pictures' : 'words',
        setPictorial,
        setMode,
        togglePictorial,
      }}
    >
      {children}
    </PictorialContext.Provider>
  );
};

export const usePictorial = (): PictorialContextType => {
  const context = useContext(PictorialContext);
  if (!context) {
    let fallbackIsPictorial = true;
    try {
      const stored = localStorage.getItem(PICTORIAL_STORAGE_KEY);
      if (stored !== null) {
        fallbackIsPictorial = stored === 'true' || stored === 'pictures';
      }
    } catch {
      // storage unavailable
    }
    return {
      isPictorial: fallbackIsPictorial,
      mode: fallbackIsPictorial ? 'pictures' : 'words',
      setPictorial: () => {},
      setMode: () => {},
      togglePictorial: () => {},
    };
  }
  return context;
};
