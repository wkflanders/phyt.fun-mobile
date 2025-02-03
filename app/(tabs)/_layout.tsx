import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar],
        tabBarActiveTintColor: phytColors.primary, // Active tab color
        tabBarInactiveTintColor: '#fff', // Inactive tab color
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Define color variables using your `phyt_*` colors
const phytColors = {
  primary: '#00F6FB', // phyt_blue
  accent: '#FE205D', // phyt_red
  background: '#101010', // phyt_bg
  textSecondary: '#777798', // phyt_text_secondary
  formBg: '#13122A', // phyt_form
  formPlaceholder: '#58587B', // phyt_form_placeholder
  formBorder: '#5454BF', // phyt_form_border
  formText: '#ff00f7', // phyt_form_text
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000',
    borderTopColor: '#000',
    borderTopWidth: 1,
    height: 100,
    paddingTop: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flexGrow: 1,
  },
  headerContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '75%',
    paddingHorizontal: 24, // px-6
  },
  logoWrapper: {
    paddingLeft: 40, // pl-10
  },
  logo: {
    width: 125,
    height: 250,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    fontSize: 32, // text-4xl
    marginTop: 16, // mt-4
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20, // text-xl
    color: phytColors.textSecondary,
    textAlign: 'center',
    marginTop: 16, // mt-4
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 56,
    width: '100%',
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: phytColors.accent, // Use red for buttons
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});

