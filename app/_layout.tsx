import { PrivyProvider, PrivyElements } from '@privy-io/expo';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { baseSepolia } from 'viem/chains';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, error] = useFonts({
    "Inconsolata-ExtraLight": require("../assets/fonts/Inconsolata-ExtraLight.ttf"),
    "Inconsolata-Light": require("../assets/fonts/Inconsolata-Light.ttf"),
    "Inconsolata-Regular": require("../assets/fonts/Inconsolata-Regular.ttf"),
    "Inconsolata-Medium": require("../assets/fonts/Inconsolata-Medium.ttf"),
    "Inconsolata-Bold": require("../assets/fonts/Inconsolata-Bold.ttf"),
    "Inconsolata-SemiBold": require("../assets/fonts/Inconsolata-SemiBold.ttf"),
    "Inconsolata-ExtraBold": require("../assets/fonts/Inconsolata-ExtraBold.ttf"),
    "Inconsolata-Black": require("../assets/fonts/Inconsolata-Black.ttf"),
    "Inter-ExtraLight": require("../assets/fonts/Inter-ExtraLight.ttf"),
    "Inter-Light": require("../assets/fonts/Inter-Light.ttf"),
    "Inter-Thin": require("../assets/fonts/Inter-Thin.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-ExtraBold": require("../assets/fonts/Inter-ExtraBold.ttf"),
    "Inter-Black": require("../assets/fonts/Inter-Black.ttf"),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PrivyProvider
      appId={'cm466mv4o01wfkhkse3g9gyhr'}
      clientId={'client-WY5eJqKxgS2bURn6XZU2CTYFMphvJ8X9he8fipPukPvKH'}
      supportedChains={[baseSepolia]}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <PrivyElements />
    </PrivyProvider >
  );
}
