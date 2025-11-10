import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { Slot } from "expo-router";

// Thème Paper (tu peux garder celui que tu avais)
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2196F3",
    secondary: "#4CAF50",
    error: "#F44336",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    onPrimary: "#FFFFFF",
    onSurface: "#333333",
  },
  roundness: 10,
};

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar
            backgroundColor={theme.colors.primary}
            barStyle="light-content"
          />
          <Slot />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
