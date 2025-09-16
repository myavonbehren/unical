const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(pdfjs-dist|mammoth)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^pdfjs-dist$': '<rootDir>/__mocks__/pdfjs-dist.js',
    '^mammoth$': '<rootDir>/__mocks__/mammoth.js',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)