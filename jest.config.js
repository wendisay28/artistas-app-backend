export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@supabase/supabase-js$': '<rootDir>/src/__mocks__/@supabase/supabase-js.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/tests/setupTests.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@supabase/supabase-js)/)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 30000,
};
