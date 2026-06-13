import * as Haptics from 'expo-haptics'

// Thin wrapper so call sites read as intent (`haptics.success()`) and we have a
// single place to globally disable haptics if ever needed. See frontend.md §8.
// All calls are fire-and-forget (they return promises we intentionally ignore).
export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
} as const

export type HapticKind = keyof typeof haptics
