/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

const PhytColors = {
  primary: '#00F6FB', // phyt_blue
  accent: '#FE205D',  // phyt_red
  background: '#101010', // phyt_bg
  textSecondary: '#777798', // phyt_text_secondary
  formBg: '#13122A', // phyt_form
  formPlaceholder: '#58587B', // phyt_form_placeholder
  formBorder: '#5454BF', // phyt_form_border
  formText: '#ff00f7', // phyt_form_text
  destructive: '#ef4444', // For errors
  success: '#10b981', // For success states
  info: '#3b82f6', // For info states
  warning: '#f59e0b', // For warnings
};

export default PhytColors;