/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@sorter/common$': '<rootDir>/../common/src/index.ts', '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, diagnostics: false, tsconfig: { module: 'ESNext', moduleResolution: 'Bundler', rootDir: '../..' } }],
  },
};
