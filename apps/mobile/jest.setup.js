// Jest setup for the mobile app. JS (not TS) so it stays out of tsc + eslint.

// Reanimated v3 ships a jest mock; use it and stub the worklet init.
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  // The mock omits a few hooks our primitives use — add safe stubs.
  Reanimated.useReducedMotion = () => false
  return Reanimated
})

// expo-haptics is a native module — no-op in the test environment.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}))
