module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // pnpm nests deps under node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>, which
  // the default ignore pattern misses — so RN's Flow-typed source slips through
  // untransformed. Transform anything under .pnpm whose path hits the RN/Expo set.
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!.*(react-native|expo|@react-navigation|@tanstack|@gorhom|@shopify|@expo))',
  ],
}
