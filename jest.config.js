module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  cacheDirectory: '.jest-cache',
  coverageDirectory: '.jest-coverage',
  collectCoverageFrom: ['tests/**/*.{ts,tsx,js,jsx}'],
  setupFilesAfterEnv: ['<rootDir>/utils/jest.setup.js'],
  coverageReporters: ['html', 'text'],
  modulePathIgnorePatterns: ['./node_modules'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/packages/(?:.+?)/lib/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
