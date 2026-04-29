import { SafeAreaListener } from 'react-native-safe-area-context';

import { Uniwind } from 'uniwind';

export const SafeAreaListenerComponent = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaListener
      onChange={({ insets }) => {
        Uniwind.updateInsets(insets);
      }}
    >
      {children}
    </SafeAreaListener>
  );
};
