import React, { createContext, useContext, useState, useEffect } from 'react';

interface PictorialContextType {
  isPictorial: boolean;
  mode: 'pictures' | 'words';
  alwaysShowListen: boolean;
  setPictorial: (val: boolean) => void;
  setMode: (mode: 'pictures' | 'words') => void;
  togglePictorial: () => void;
  setAlwaysShowListen: (val: boolean) => void;
  toggleAlwaysShowListen: () => void;
}

const PictorialContext = createContext<PictorialContextType | undefined>(undefined);

export const PICTORIAL_STORAGE_KEY = 'agrisage_pictorial_mode';
export const ALWAYS_SHOW_LISTEN_KEY = 'agrisage_always_show_listen';

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

  const [alwaysShowListen, setAlwaysShowListenState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ALWAYS_SHOW_LISTEN_KEY) === 'true';
    } catch {
      return false;
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

  const setAlwaysShowListen = (val: boolean) => {
    setAlwaysShowListenState(val);
    try {
      localStorage.setItem(ALWAYS_SHOW_LISTEN_KEY, val ? 'true' : 'false');
    } catch {
      // storage unavailable
    }
  };

  const toggleAlwaysShowListen = () => {
    setAlwaysShowListen(!alwaysShowListen);
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
        alwaysShowListen,
        setPictorial,
        setMode,
        togglePictorial,
        setAlwaysShowListen,
        toggleAlwaysShowListen,
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
    let fallbackAlwaysShowListen = false;
    try {
      const stored = localStorage.getItem(PICTORIAL_STORAGE_KEY);
      if (stored !== null) {
        fallbackIsPictorial = stored === 'true' || stored === 'pictures';
      }
      fallbackAlwaysShowListen = localStorage.getItem(ALWAYS_SHOW_LISTEN_KEY) === 'true';
    } catch {
      // storage unavailable
    }
    return {
      isPictorial: fallbackIsPictorial,
      mode: fallbackIsPictorial ? 'pictures' : 'words',
      alwaysShowListen: fallbackAlwaysShowListen,
      setPictorial: () => {},
      setMode: () => {},
      togglePictorial: () => {},
      setAlwaysShowListen: () => {},
      toggleAlwaysShowListen: () => {},
    };
  }
  return context;
};

export const useShowListen = (): boolean => {
  const { isPictorial, alwaysShowListen } = usePictorial();
  return isPictorial || alwaysShowListen;
};
