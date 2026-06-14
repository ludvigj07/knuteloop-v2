import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

// Thin wrapper so call sites read as intent (`haptics.success()`) and we have a
// single place to globally disable haptics if ever needed. See frontend.md §8.
// All calls are fire-and-forget (they return promises we intentionally ignore).
//
// Haptics are native-only — expo-haptics throws synchronously on web (and any
// platform without the native module). So on web every call is a no-op, otherwise
// a press in the browser preview crashes. On iOS/Android they fire as normal.
const supported = Platform.OS === 'ios' || Platform.OS === 'android'
const noop = async (): Promise<void> => {}

export const haptics = {
  light: () => (supported ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) : noop()),
  medium: () => (supported ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) : noop()),
  heavy: () => (supported ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) : noop()),
  success: () =>
    supported ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : noop(),
  warning: () =>
    supported ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) : noop(),
  error: () =>
    supported ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) : noop(),
  selection: () => (supported ? Haptics.selectionAsync() : noop()),
} as const

export type HapticKind = keyof typeof haptics
