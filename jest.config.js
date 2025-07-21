const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './', // project root
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/common-pages/(.*)$': '<rootDir>/src/common-pages/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/api/(.*)$': '<rootDir>/src/api/$1',
    '^@/(.*)$': '<rootDir>/src/$1', // fallback for other absolute imports under src/
  },
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [
    '/node_modules/(?!(redux-actions)/)', // keep this if you use redux-actions
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/_app.tsx',
    '!src/**/_document.tsx',
  ],
};

module.exports = createJestConfig(customJestConfig);
