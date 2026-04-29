import { createContext, type PropsWithChildren, use } from 'react';

import { useGameScreenController } from './hooks/useGameScreenController';

type GameScreenContextValue = ReturnType<typeof useGameScreenController>;

const GameScreenContext = createContext<GameScreenContextValue | null>(null);

export const GameScreenProvider = ({ children }: PropsWithChildren) => {
  const value = useGameScreenController();

  return <GameScreenContext.Provider value={value}>{children}</GameScreenContext.Provider>;
};

export const useGameScreenContext = () => {
  const context = use(GameScreenContext);

  if (!context) {
    throw new Error('useGameScreenContext must be used within GameScreenProvider');
  }

  return context;
};
